
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export const useAIChatMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getStoredSettings = () => {
    const provider = localStorage.getItem('ai-provider') || 'openai';
    const model = localStorage.getItem('ai-model') || 'gpt-4o-mini';
    return { provider, model };
  };

  const sendMessage = async (content: string, reasoning: boolean = false) => {
    if (!content.trim()) return;

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use AI chat.",
        variant: "destructive"
      });
      return;
    }

    // Add user message immediately
    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { provider, model } = getStoredSettings();
      
      // Call our Supabase edge function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: content.trim(),
          provider,
          model,
          reasoning,
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Add AI response
      const aiMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'ai',
        content: data.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your message. Please make sure your API keys are configured in Settings.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "AI Error",
        description: "Failed to get AI response. Check your API keys in Settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    sendMessage,
    isLoading
  };
};
