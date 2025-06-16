
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AIMessage } from '@/types/ai';

export const useAIChatMessages = () => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getStoredSettings = () => {
    const provider = localStorage.getItem('ai-provider') || 'openai';
    const model = localStorage.getItem('ai-model') || 'gpt-4o-mini';
    return { provider, model };
  };

  const checkApiKeyExists = async (provider: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('id, encrypted_key')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .maybeSingle();
      
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

  const sendMessage = async (content: string, reasoning: boolean = false) => {
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
    
    // Check if API key exists before proceeding
    const hasApiKey = await checkApiKeyExists(provider);
    if (!hasApiKey) {
      toast({
        title: "API Key Missing",
        description: `Please configure your ${provider} API key in Settings before using AI chat.`,
        variant: "destructive"
      });
      return;
    }

    const userMessage: AIMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.log('Sending message to AI:', { provider, model, reasoning, contentLength: content.length });
      
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: content.trim(),
          provider,
          model,
          reasoning,
          userId: user.id
        }
      });

      console.log('AI response received:', { hasData: !!data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to call AI service');
      }

      if (data?.error) {
        console.error('AI API error:', data.error);
        throw new Error(data.error);
      }

      if (!data?.content) {
        throw new Error('Empty response from AI service');
      }

      const aiMessage: AIMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'ai',
        content: data.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      toast({
        title: "Message sent",
        description: "AI response received successfully.",
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: AIMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'ai',
        content: `Sorry, I encountered an error: ${error.message}. Please check your API keys in Settings and try again.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "AI Error",
        description: error.message || "Failed to get AI response. Check your settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading
  };
};
