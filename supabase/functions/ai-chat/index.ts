
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  provider: string;
  model: string;
  reasoning?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Set auth for supabase client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { message, provider, model, reasoning = false }: ChatRequest = await req.json();

    // Get user's API key for the provider
    const { data: apiKeyData, error: keyError } = await supabaseClient
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (keyError || !apiKeyData) {
      throw new Error(`No API key found for provider: ${provider}`);
    }

    const apiKey = apiKeyData.encrypted_key;
    let response;

    switch (provider) {
      case 'openai':
        response = await callOpenAI(message, model, apiKey, reasoning);
        break;
      case 'anthropic':
        response = await callAnthropic(message, model, apiKey, reasoning);
        break;
      case 'google':
        response = await callGoogle(message, model, apiKey, reasoning);
        break;
      case 'deepseek':
        response = await callDeepSeek(message, model, apiKey, reasoning);
        break;
      case 'openrouter':
        response = await callOpenRouter(message, model, apiKey, reasoning);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred processing your request' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callOpenAI(message: string, model: string, apiKey: string, reasoning: boolean) {
  const messages = [
    {
      role: 'system',
      content: reasoning 
        ? 'You are a helpful assistant. Think through problems step by step and show your reasoning.'
        : 'You are a helpful assistant.'
    },
    { role: 'user', content: message }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    id: data.id || Math.random().toString(36).substr(2, 9),
    content: data.choices[0].message.content,
    createdAt: new Date().toISOString(),
  };
}

async function callAnthropic(message: string, model: string, apiKey: string, reasoning: boolean) {
  const systemPrompt = reasoning 
    ? 'You are a helpful assistant. Think through problems step by step and show your reasoning.'
    : 'You are a helpful assistant.';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    id: data.id || Math.random().toString(36).substr(2, 9),
    content: data.content[0].text,
    createdAt: new Date().toISOString(),
  };
}

async function callGoogle(message: string, model: string, apiKey: string, reasoning: boolean) {
  const systemInstruction = reasoning 
    ? 'You are a helpful assistant. Think through problems step by step and show your reasoning.'
    : 'You are a helpful assistant.';

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: message }] }],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    content: data.candidates[0].content.parts[0].text,
    createdAt: new Date().toISOString(),
  };
}

async function callDeepSeek(message: string, model: string, apiKey: string, reasoning: boolean) {
  const messages = [
    {
      role: 'system',
      content: reasoning 
        ? 'You are a helpful assistant. Think through problems step by step and show your reasoning.'
        : 'You are a helpful assistant.'
    },
    { role: 'user', content: message }
  ];

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    id: data.id || Math.random().toString(36).substr(2, 9),
    content: data.choices[0].message.content,
    createdAt: new Date().toISOString(),
  };
}

async function callOpenRouter(message: string, model: string, apiKey: string, reasoning: boolean) {
  const messages = [
    {
      role: 'system',
      content: reasoning 
        ? 'You are a helpful assistant. Think through problems step by step and show your reasoning.'
        : 'You are a helpful assistant.'
    },
    { role: 'user', content: message }
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lovable.dev',
      'X-Title': 'Student Library AI Chat',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    id: data.id || Math.random().toString(36).substr(2, 9),
    content: data.choices[0].message.content,
    createdAt: new Date().toISOString(),
  };
}
