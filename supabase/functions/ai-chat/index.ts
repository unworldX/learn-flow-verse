
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, provider, model, reasoning, userId } = await req.json();

    console.log('AI Chat Request:', { provider, model, userId, messageLength: message?.length });

    // Validate inputs
    if (!userId) {
      throw new Error('User authentication required');
    }

    if (!message?.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (!provider) {
      throw new Error('Provider is required');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's API key with simplified query
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('user_api_keys')
      .select('encrypted_key, provider')
      .eq('user_id', userId)
      .eq('provider', provider.toLowerCase().trim())
      .single();

    if (apiKeyError || !apiKeyData?.encrypted_key) {
      console.error('API key not found:', { provider, userId, error: apiKeyError });
      throw new Error(`No API key configured for ${provider}. Please add your API key in Settings.`);
    }

    const apiKey = apiKeyData.encrypted_key.trim();
    console.log('Found API key for provider:', provider);

    // Call AI API based on provider
    let response;
    const systemPrompt = reasoning 
      ? 'You are a helpful AI study assistant. Think step by step and provide detailed reasoning for your responses.'
      : 'You are a helpful AI study assistant.';

    switch (provider.toLowerCase()) {
      case 'openai':
        response = await callOpenAI(apiKey, model, message, systemPrompt);
        break;
      case 'anthropic':
        response = await callAnthropic(apiKey, model, message, systemPrompt);
        break;
      case 'google':
        response = await callGoogle(apiKey, model, message, systemPrompt);
        break;
      case 'deepseek':
        response = await callDeepSeek(apiKey, model, message, systemPrompt);
        break;
      case 'openrouter':
        response = await callOpenRouter(apiKey, model, message, systemPrompt);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    console.log('AI response successful');

    return new Response(JSON.stringify({ content: response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Chat Error:', error.message);
    
    return new Response(JSON.stringify({ 
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callOpenAI(apiKey: string, model: string, message: string, systemPrompt: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(apiKey: string, model: string, message: string, systemPrompt: string) {
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
      messages: [{ role: 'user', content: `${systemPrompt}\n\n${message}` }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGoogle(apiKey: string, model: string, message: string, systemPrompt: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\n\n${message}` }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API error: ${errorText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callDeepSeek(apiKey: string, model: string, message: string, systemPrompt: string) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOpenRouter(apiKey: string, model: string, message: string, systemPrompt: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://your-study-app.com',
      'X-Title': 'AI Study Assistant'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
