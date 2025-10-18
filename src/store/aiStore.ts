// Zustand store for AI Assistant state
import { create } from 'zustand';
import { AIMessage } from '@/types/notes';

interface AIState {
  messages: AIMessage[];
  isLoading: boolean;
  
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  sendMessage: (content: string) => Promise<void>;
}

export const useAIStore = create<AIState>((set, get) => ({
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you summarize notes, explain concepts, generate flashcards, and more. How can I help you today?',
      timestamp: new Date(),
    },
  ],
  isLoading: false,
  
  addUserMessage: (content) => {
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    set(state => ({ messages: [...state.messages, userMessage] }));
  },
  
  addAssistantMessage: (content) => {
    const assistantMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    set(state => ({ messages: [...state.messages, assistantMessage] }));
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  clearMessages: () => set({ 
    messages: [{
      id: '1',
      role: 'assistant',
      content: 'Conversation cleared. How can I help you?',
      timestamp: new Date(),
    }] 
  }),
  
  // Simulated AI response - replace with actual API call
  sendMessage: async (content) => {
    const { addUserMessage, addAssistantMessage, setLoading } = get();
    
    addUserMessage(content);
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated response - replace with actual API call to OpenAI/Anthropic
    const response = `I understand you want help with: "${content}". Here's what I can suggest based on your current note...`;
    
    addAssistantMessage(response);
    setLoading(false);
  },
}));
