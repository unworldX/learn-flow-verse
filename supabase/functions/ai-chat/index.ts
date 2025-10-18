
// deno-lint-ignore-file
// @ts-expect-error Deno URLs are resolved at runtime in Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error Deno URLs are resolved at runtime in Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Minimal Deno global declaration for local type-checking context.
declare const Deno: { env: { get(key: string): string | undefined } };

// CORS + security
const corsHeaders: Record<string,string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-authorization, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

const ALLOWED_PROVIDERS = new Set(['openai','anthropic','google','deepseek','openrouter']);
const MAX_MESSAGE_CHARS = 8000;

interface RequestPayload {
  message: string;
  provider: string;
  model: string;
  reasoning?: boolean;
  // userId may be supplied but we will ignore it and rely on token user id
  userId?: string;
}

interface JsonOk<T> { ok: true; data: T }
interface JsonErr { ok: false; error: { code: string; message: string; details?: unknown } }
const ok = <T>(data: T, status = 200) => new Response(JSON.stringify({ ok: true, data } as JsonOk<T>), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const err = (code: string, message: string, status = 400, details?: unknown) => new Response(JSON.stringify({ ok: false, error: { code, message, details } } as JsonErr), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return err('method_not_allowed','Only POST supported',405);

  try {
    let payload: RequestPayload;
    try {
      payload = await req.json();
    } catch {
      return err('invalid_json','Malformed JSON body');
    }
    const { message, provider, model, reasoning } = payload;

    // Auth using user access token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return err('unauthorized','Missing Authorization header',401);
    const token = authHeader.replace(/^Bearer\s+/i,'').trim();
    if (!token) return err('unauthorized','Empty bearer token',401);

    if (!message || !provider || !model) return err('missing_fields','Required: message, provider, model');
    if (message.length > MAX_MESSAGE_CHARS) return err('message_too_long',`Message exceeds ${MAX_MESSAGE_CHARS} characters`);

    const normalizedProvider = provider.toLowerCase().trim();
    if (!ALLOWED_PROVIDERS.has(normalizedProvider)) return err('unsupported_provider',`Unsupported provider: ${provider}`);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !anonKey) return err('server_misconfig','Missing Supabase env');

    const supabase = createClient(supabaseUrl, anonKey, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return err('unauthorized','Invalid or expired token',401);

    console.log('[ai-chat] request', { provider: normalizedProvider, model, userId: user.id, len: message.length });

    // Fetch API key for provider scoped to the authenticated user
    const { data: apiKeyRow, error: keyErr } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .eq('provider', normalizedProvider)
      .maybeSingle();
    if (keyErr) return err('key_fetch_failed','Failed to fetch provider key',500,keyErr.message);

    // Fallback to environment-level API keys if user-scoped key is not present
    const envKeyMap: Record<string, string | undefined> = {
      openai: Deno.env.get('OPENAI_API_KEY'),
      anthropic: Deno.env.get('ANTHROPIC_API_KEY'),
      google: Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY'),
      deepseek: Deno.env.get('DEEPSEEK_API_KEY'),
      openrouter: Deno.env.get('OPENROUTER_API_KEY'),
    };
    const apiKey = apiKeyRow?.encrypted_key || envKeyMap[normalizedProvider];
    if (!apiKey) return err('no_api_key',`No API key configured for ${normalizedProvider}`,400);

    // Prepare provider-specific request
  let apiUrl = '';
  const headers: Record<string,string> = { 'Content-Type':'application/json' };
  type ChatCompletionBody = { model: string; messages: Array<{ role: string; content: string }>; max_tokens?: number; temperature?: number } | Record<string,unknown>;
  let body: ChatCompletionBody = { model, messages: [{ role: 'user', content: message }], max_tokens: 4000, temperature: 0.7 };
    switch (normalizedProvider) {
      case 'openai':
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        headers.Authorization = `Bearer ${apiKey}`;
        if (reasoning && model.includes('o1')) { delete body.temperature; delete body.max_tokens; }
        break;
      case 'anthropic':
        apiUrl = 'https://api.anthropic.com/v1/messages';
        headers.Authorization = `Bearer ${apiKey}`; headers['anthropic-version'] = '2023-06-01';
        body = { model, max_tokens: 4000, messages: [{ role: 'user', content: message }] };
        break;
      case 'google':
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        body = { contents: [{ parts: [{ text: message }] }], generationConfig: { maxOutputTokens: 4000, temperature: 0.7 } };
        break;
      case 'deepseek':
        apiUrl = 'https://api.deepseek.com/v1/chat/completions'; headers.Authorization = `Bearer ${apiKey}`; break;
      case 'openrouter':
        apiUrl = 'https://openrouter.ai/api/v1/chat/completions'; headers.Authorization = `Bearer ${apiKey}`; headers['HTTP-Referer'] = 'https://lovable.app'; headers['X-Title'] = 'StudyFlow AI Chat'; break;
    }

  const providerResp = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!providerResp.ok) {
      let details: unknown; let text: string | undefined;
      try { text = await providerResp.text(); details = text; } catch (captureErr) { details = { parseError: (captureErr as Error).message }; }
      return err('provider_error',`Provider HTTP ${providerResp.status}`, providerResp.status, details);
    }
    const data = await providerResp.json();
    let content = '';
    switch (normalizedProvider) {
      case 'openai':
      case 'deepseek':
      case 'openrouter': content = data.choices?.[0]?.message?.content || ''; break;
      case 'anthropic': content = data.content?.[0]?.text || ''; break;
      case 'google': content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''; break;
    }
    if (!content) return err('empty_response','No content returned by provider',502,data);
    return ok({ content, model, provider: normalizedProvider });
  } catch (e) {
    const error = e as Error; console.error('[ai-chat] uncaught', error);
    return err('server_error', error.message || 'Unexpected server error',500);
  }
});
