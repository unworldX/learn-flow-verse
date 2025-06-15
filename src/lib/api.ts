
// Mock API functions for AI chat functionality with proper state management
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

// In-memory storage for mock data
const mockSessions: ChatSession[] = [
  {
    id: 'session-1',
    name: 'General Chat',
    createdAt: new Date().toISOString(),
  }
];

const mockMessages: Record<string, ChatMessage[]> = {
  'session-1': []
};

// Mock functions with proper state management
export const createChatCompletion = async (params: CreateChatCompletionParams): Promise<ChatMessage> => {
  console.log('Creating chat completion with params:', params);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Generate a more realistic response based on the input
  let responseContent = '';
  const message = params.message.toLowerCase();
  
  if (message.includes('hello') || message.includes('hi')) {
    responseContent = "Hello! I'm your AI assistant. How can I help you today?";
  } else if (message.includes('help')) {
    responseContent = "I'm here to help! You can ask me questions about various topics, request assistance with tasks, or just have a conversation.";
  } else if (message.includes('study') || message.includes('learn')) {
    responseContent = "I'd be happy to help you with your studies! What subject or topic would you like to explore?";
  } else if (params.reasoning) {
    responseContent = `Let me think through this step by step:\n\n1. You asked: "${params.message}"\n2. This seems to be about [analyzing your question]\n3. Based on my understanding, here's my response:\n\n${params.message.includes('?') ? 'This is an interesting question that requires careful consideration.' : 'I understand your statement and here\'s my thoughtful response.'}\n\nReasoning mode helps me provide more detailed and structured answers to complex queries.`;
  } else {
    const responses = [
      `That's an interesting point about "${params.message}". Let me share some thoughts on that.`,
      `I understand you're asking about "${params.message}". Here's what I think...`,
      `Great question! Regarding "${params.message}", I can offer some insights.`,
      `Thank you for sharing that. In response to "${params.message}", I'd say...`,
      `I see you mentioned "${params.message}". Let me provide a helpful response.`
    ];
    responseContent = responses[Math.floor(Math.random() * responses.length)];
  }
  
  const newMessage: ChatMessage = {
    id: Math.random().toString(36).substr(2, 9),
    role: 'assistant',
    content: responseContent,
    createdAt: new Date().toISOString(),
  };
  
  // Store the message in the session
  if (params.sessionId && mockMessages[params.sessionId]) {
    mockMessages[params.sessionId].push(newMessage);
  }
  
  console.log('Generated AI response:', newMessage);
  return newMessage;
};

export const getChatSessions = async (): Promise<ChatSession[]> => {
  console.log('Fetching chat sessions:', mockSessions);
  return [...mockSessions];
};

export const getChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  console.log('Fetching messages for session:', sessionId);
  return mockMessages[sessionId] || [];
};

export const deleteChatSession = async (sessionId: string): Promise<void> => {
  console.log('Deleting session:', sessionId);
  const index = mockSessions.findIndex(session => session.id === sessionId);
  if (index > -1) {
    mockSessions.splice(index, 1);
    delete mockMessages[sessionId];
  }
};

export const createChatSession = async (name: string): Promise<ChatSession> => {
  const newSession: ChatSession = {
    id: Math.random().toString(36).substring(7),
    name,
    createdAt: new Date().toISOString(),
  };
  
  mockSessions.push(newSession);
  mockMessages[newSession.id] = [];
  
  console.log('Created new session:', newSession);
  return newSession;
};

export const uploadPdf = async (formData: FormData): Promise<void> => {
  console.log('Uploading PDF:', formData);
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 2000));
};
