
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, provider, model, reasoning, userId } = await req.json()

    if (!message || !provider || !model || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: message, provider, model, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('AI Chat request:', { provider, model, reasoning, userId, messageLength: message.length })

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Normalize provider name for consistency
    const normalizedProvider = provider.toLowerCase().trim()
    
    console.log('Looking for API key with provider:', normalizedProvider)

    // Get user's API key for the specified provider
    const { data: apiKeyData, error: keyError } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', userId)
      .eq('provider', normalizedProvider)
      .maybeSingle()

    if (keyError) {
      console.error('Error fetching API key:', keyError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch API key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!apiKeyData || !apiKeyData.encrypted_key) {
      console.error('No API key found for provider:', normalizedProvider)
      return new Response(
        JSON.stringify({ error: `No API key found for provider: ${provider}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = apiKeyData.encrypted_key

    let apiResponse
    let apiUrl
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    let body: any = {
      model,
      messages: [{ role: 'user', content: message }],
      max_tokens: 4000,
      temperature: 0.7,
    }

    // Configure API call based on provider
    switch (normalizedProvider) {
      case 'openai':
        apiUrl = 'https://api.openai.com/v1/chat/completions'
        headers['Authorization'] = `Bearer ${apiKey}`
        if (reasoning && model.includes('o1')) {
          // o1 models don't support some parameters
          delete body.temperature
          delete body.max_tokens
        }
        break

      case 'anthropic':
        apiUrl = 'https://api.anthropic.com/v1/messages'
        headers['Authorization'] = `Bearer ${apiKey}`
        headers['anthropic-version'] = '2023-06-01'
        body = {
          model,
          max_tokens: 4000,
          messages: [{ role: 'user', content: message }]
        }
        break

      case 'google':
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        body = {
          contents: [{ parts: [{ text: message }] }],
          generationConfig: {
            maxOutputTokens: 4000,
            temperature: 0.7,
          }
        }
        break

      case 'deepseek':
        apiUrl = 'https://api.deepseek.com/v1/chat/completions'
        headers['Authorization'] = `Bearer ${apiKey}`
        break

      case 'openrouter':
        apiUrl = 'https://openrouter.ai/api/v1/chat/completions'
        headers['Authorization'] = `Bearer ${apiKey}`
        headers['HTTP-Referer'] = 'https://lovable.app'
        headers['X-Title'] = 'StudyFlow AI Chat'
        break

      default:
        return new Response(
          JSON.stringify({ error: `Unsupported provider: ${provider}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    console.log('Making API request to:', apiUrl)

    // Make API request
    apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('API Error:', { status: apiResponse.status, error: errorText })
      return new Response(
        JSON.stringify({ error: `API Error: ${apiResponse.status} - ${errorText}` }),
        { status: apiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await apiResponse.json()
    console.log('API Response received successfully')

    // Extract content based on provider
    let content = ''
    switch (normalizedProvider) {
      case 'openai':
      case 'deepseek':
      case 'openrouter':
        content = data.choices?.[0]?.message?.content || ''
        break
      case 'anthropic':
        content = data.content?.[0]?.text || ''
        break
      case 'google':
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        break
    }

    if (!content) {
      console.error('No content in API response:', data)
      return new Response(
        JSON.stringify({ error: 'No content received from AI provider' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
