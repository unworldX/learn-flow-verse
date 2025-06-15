
import { useState } from 'react';
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

  const sendMessage = async (content: string, provider?: string, model?: string, reasoning: boolean = false) => {
    if (!content.trim()) return;

    // Get current provider and model from localStorage if not provided
    const currentProvider = provider || localStorage.getItem('ai-provider') || 'openai';
    const currentModel = model || localStorage.getItem('ai-model') || 'gpt-4o-mini';

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
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: content.trim(),
          provider: currentProvider,
          model: currentModel,
          reasoning,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Add AI response
      const aiMessage: Message = {
        id: data.id,
        type: 'ai',
        content: data.content,
        timestamp: new Date(data.createdAt),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'ai',
        content: error.message || 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
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
