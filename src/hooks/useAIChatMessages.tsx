import { useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AIMessage } from '@/types/ai';

export const useAIChatMessages = () => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Normalize provider name consistently
  const normalizeProvider = (providerName: string): string => {
    return providerName.toLowerCase().trim();
  };

  const getStoredSettings = () => {
    const provider = localStorage.getItem('ai-provider') || 'openai';
    const model = localStorage.getItem('ai-model') || 'gpt-4o-mini';

    // Normalize provider name for consistency
    const normalizedProvider = normalizeProvider(provider);

    console.log('Stored settings:', {
      originalProvider: provider,
      normalizedProvider,
      model,
      localStorage: {
        provider: localStorage.getItem('ai-provider'),
        model: localStorage.getItem('ai-model')
      }
    });

    return { provider: normalizedProvider, model };
  };

  const checkApiKeyExists = async (provider: string) => {
    if (!user) return false;

    try {
      const normalizedProvider = normalizeProvider(provider);

      console.log('Checking API key for provider:', { original: provider, normalized: normalizedProvider });

      const { data, error } = await supabase
        .from('user_api_keys')
        .select('id, encrypted_key, provider')
        .eq('user_id', user.id)
        .eq('provider', normalizedProvider)
        .maybeSingle();

      console.log('API key check result:', {
        hasData: !!data,
        hasKey: data && data.encrypted_key && data.encrypted_key.trim().length > 0,
        foundProvider: data?.provider,
        error
      });

      if (error) {
        console.error('Error checking API key:', error);
        return false;
      }

      return data && data.encrypted_key && data.encrypted_key.trim().length > 0;
    } catch (error) {
      console.error('Exception checking API key:', error);
      return false;
    }
  };

  const sendMessage = async (content: string, reasoning: boolean = false): Promise<AIMessage | undefined> => {
    if (!content.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message before sending.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use AI chat.",
        variant: "destructive"
      });
      return;
    }

    const { provider, model } = getStoredSettings();

    const hasApiKey = await checkApiKeyExists(provider);
    if (!hasApiKey) {
      toast({
        title: "API Key Missing",
        description: `Please configure your ${provider} API key in Settings before using AI chat.`,
        variant: "destructive"
      });
      return;
    }

    // Note: User message is now added optimistically in the component.
    // This hook only handles the AI response part of the conversation flow.
    setIsLoading(true);

    try {
      // Ensure we pass a fresh access token to avoid 401s due to race conditions
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: {
          message: content.trim(),
          provider: provider,
          model,
          reasoning,
          userId: user.id
        }
      });

      if (error) throw new Error(error.message || 'Failed to call AI service');

      // Edge function returns an envelope: { ok: true, data } | { ok: false, error }
      type FnError = { code?: string; message: string; details?: unknown };
      type FnEnvelope<T> = { ok: true; data: T } | { ok: false; error: FnError };
      const envUnknown = data as unknown;
      const isEnvelope = (v: unknown): v is FnEnvelope<{ content: string; model: string; provider: string }> =>
        !!v && typeof v === 'object' && 'ok' in v;
      if (!isEnvelope(envUnknown)) {
        throw new Error('Invalid response from AI service');
      }
      const env = envUnknown as FnEnvelope<{ content: string; model: string; provider: string }>;
      if (env.ok === false) {
        const msg = env.error?.message || 'AI service error';
        throw new Error(msg);
      }
      const aiContent = env.data?.content;
      if (!aiContent || typeof aiContent !== 'string' || aiContent.trim() === '') {
        throw new Error('Empty response from AI service');
      }

      const aiMessage: AIMessage = {
        id: crypto.randomUUID(),
        type: 'ai',
        content: aiContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      return aiMessage; // Return the successful AI message
    } catch (e: unknown) {
      const messageText = e instanceof Error ? e.message : 'Unknown error';
      const errorMessage: AIMessage = {
        id: crypto.randomUUID(),
        type: 'ai',
        content: `Sorry, I encountered an error: ${messageText}. Please check your API keys in Settings and try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "AI Error",
        description: messageText || "Failed to get AI response. Check your settings.",
        variant: "destructive"
      });
      return undefined; // Return undefined on failure
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const addMessage = (message: AIMessage) => {
    setMessages(prev => [...prev, message]);
  };

  return {
    messages,
    setMessages,
    addMessage,
    sendMessage,
    clearMessages,
    isLoading
  };
};
