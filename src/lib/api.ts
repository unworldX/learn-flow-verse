
import { ChatMessage, ChatSession, CreateChatCompletionParams } from "@/types";

// Mock functions - replace with actual API calls when backend is ready
export const createChatCompletion = async (params: CreateChatCompletionParams): Promise<ChatMessage> => {
  console.log("createChatCompletion called with:", params);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  
  const response: ChatMessage = {
    id: Math.random().toString(36).substr(2, 9),
    role: 'assistant',
    content: `This is a mock response to: "${params.message}". Reasoning mode: ${params.reasoning ? 'ON' : 'OFF'}`,
    createdAt: new Date().toISOString(),
  };

  console.log("createChatCompletion responding with:", response);
  return response;
};

export const getChatSessions = async (): Promise<ChatSession[]> => {
  return [
    {
      id: 'session-1',
      name: 'General Chat',
      createdAt: new Date().toISOString(),
    }
  ];
};

export const getChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  return [];
};

export const deleteChatSession = async (sessionId: string): Promise<void> => {
  console.log('Deleting session:', sessionId);
};

export const uploadPdf = async (formData: FormData): Promise<void> => {
  console.log('Uploading PDF:', formData);
};
