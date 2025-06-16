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

    console.log('Received request:', { 
      provider, 
      model, 
      reasoning, 
      userId, 
      messageLength: message?.length,
      providerType: typeof provider,
      providerValue: JSON.stringify(provider)
    });

    if (!userId) {
      throw new Error('User authentication required');
    }

    if (!message?.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (!provider || typeof provider !== 'string') {
      throw new Error(`Invalid provider: ${JSON.stringify(provider)}`);
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Normalize provider name to lowercase for consistent lookup
    const normalizedProvider = provider.toLowerCase().trim();
    
    console.log('Normalized provider:', normalizedProvider);

    // Get user's API key for the provider with case-insensitive lookup
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('user_api_keys')
      .select('encrypted_key, provider')
      .eq('user_id', userId)
      .ilike('provider', normalizedProvider) // Case-insensitive match
      .maybeSingle();

    console.log('API key query result:', { 
      hasApiKey: !!apiKeyData, 
      error: apiKeyError,
      foundProvider: apiKeyData?.provider,
      queryProvider: normalizedProvider
    });

    if (apiKeyError) {
      console.error('Database error:', apiKeyError);
      throw new Error(`Database error: ${apiKeyError.message}`);
    }

    if (!apiKeyData || !apiKeyData.encrypted_key) {
      // Try exact match as fallback
      const { data: fallbackData } = await supabase
        .from('user_api_keys')
        .select('encrypted_key, provider')
        .eq('user_id', userId)
        .eq('provider', provider)
        .maybeSingle();
      
      if (!fallbackData) {
        console.error('No API key found. Available keys for user:', userId);
        const { data: allKeys } = await supabase
          .from('user_api_keys')
          .select('provider')
          .eq('user_id', userId);
        console.log('Available providers:', allKeys?.map(k => k.provider));
        throw new Error(`No API key found for ${provider}. Please configure it in Settings.`);
      }
      
      apiKeyData.encrypted_key = fallbackData.encrypted_key;
    }

    const apiKey = apiKeyData.encrypted_key.trim();
    
    if (!apiKey) {
      throw new Error(`Empty API key for ${provider}. Please reconfigure it in Settings.`);
    }

    // Validate API key format
    if (!validateApiKeyFormat(normalizedProvider, apiKey)) {
      throw new Error(`Invalid API key format for ${provider}. Please check your API key.`);
    }

    // Validate provider-model combination
    const isValidCombination = validateProviderModel(normalizedProvider, model);
    if (!isValidCombination) {
      throw new Error(`Invalid model "${model}" for provider "${provider}". Please check your settings.`);
    }

    // Call the appropriate AI API
    let response;
    console.log(`Calling ${normalizedProvider} API with model: ${model}`);
    
    if (normalizedProvider === 'openai') {
      response = await callOpenAI(apiKey, model, message, reasoning);
    } else if (normalizedProvider === 'anthropic') {
      response = await callAnthropic(apiKey, model, message, reasoning);
    } else if (normalizedProvider === 'google') {
      response = await callGoogle(apiKey, model, message, reasoning);
    } else if (normalizedProvider === 'deepseek') {
      response = await callDeepSeek(apiKey, model, message, reasoning);
    } else if (normalizedProvider === 'openrouter') {
      response = await callOpenRouter(apiKey, model, message, reasoning);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    console.log('AI response received successfully');

    return new Response(JSON.stringify({ content: response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Validate API key format
function validateApiKeyFormat(provider: string, apiKey: string): boolean {
  if (!apiKey || apiKey.trim().length === 0) return false;
  
  const trimmedKey = apiKey.trim();
  
  switch (provider) {
    case 'openai':
      return trimmedKey.startsWith('sk-') && trimmedKey.length > 20;
    case 'anthropic':
      return trimmedKey.startsWith('sk-ant-') && trimmedKey.length > 20;
    case 'google':
      return trimmedKey.startsWith('AIza') && trimmedKey.length > 20;
    case 'deepseek':
      return trimmedKey.startsWith('sk-') && trimmedKey.length > 20;
    case 'openrouter':
      return trimmedKey.startsWith('sk-or-') && trimmedKey.length > 20;
    default:
      return trimmedKey.length > 10;
  }
}

// Validate provider-model combinations
function validateProviderModel(provider: string, model: string): boolean {
  const validCombinations: Record<string, string[]> = {
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
    google: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
    deepseek: ['deepseek-chat', 'deepseek-coder'],
    openrouter: [] // OpenRouter supports dynamic models
  };

  const validModels = validCombinations[provider];
  if (!validModels) return false;
  
  // OpenRouter allows any model since they're fetched dynamically
  if (provider === 'openrouter') return true;
  
  return validModels.includes(model);
}

async function callOpenAI(apiKey: string, model: string, message: string, reasoning: boolean) {
  console.log('Calling OpenAI API');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { 
          role: 'system', 
          content: reasoning 
            ? 'You are a helpful AI assistant. Think step by step and provide detailed reasoning for your responses.'
            : 'You are a helpful AI assistant.'
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(apiKey: string, model: string, message: string, reasoning: boolean) {
  console.log('Calling Anthropic API');
  
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
      messages: [
        { 
          role: 'user', 
          content: reasoning 
            ? `Think step by step and provide detailed reasoning: ${message}`
            : message 
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic API error:', response.status, errorText);
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGoogle(apiKey: string, model: string, message: string, reasoning: boolean) {
  console.log('Calling Google API');
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: reasoning 
            ? `Think step by step and provide detailed reasoning: ${message}`
            : message
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google API error:', response.status, errorText);
    throw new Error(`Google API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Google API');
  }
  
  return data.candidates[0].content.parts[0].text;
}

async function callDeepSeek(apiKey: string, model: string, message: string, reasoning: boolean) {
  console.log('Calling DeepSeek API');
  
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { 
          role: 'system', 
          content: reasoning 
            ? 'You are a helpful AI assistant. Think step by step and provide detailed reasoning for your responses.'
            : 'You are a helpful AI assistant.'
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('DeepSeek API error:', response.status, errorText);
    throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOpenRouter(apiKey: string, model: string, message: string, reasoning: boolean) {
  console.log('Calling OpenRouter API');
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://your-app.com',
      'X-Title': 'AI Study Assistant'
    },
    body: JSON.stringify({
      model,
      messages: [
        { 
          role: 'system', 
          content: reasoning 
            ? 'You are a helpful AI assistant. Think step by step and provide detailed reasoning for your responses.'
            : 'You are a helpful AI assistant.'
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter API error:', response.status, errorText);
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
