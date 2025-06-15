
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  name: string;
  createdAt: string;
}

export interface CreateChatCompletionParams {
  sessionId?: string;
  message: string;
  reasoning: boolean;
}
