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
  model?: string;
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

// Enhanced response generation based on model
const generateModelResponse = (message: string, model: string, reasoning: boolean): string => {
  const lowerMessage = message.toLowerCase();
  
  // Model-specific response patterns
  const modelPersonalities = {
    'gpt-4o-mini': 'I\'m GPT-4o Mini, a fast and efficient AI assistant. ',
    'gpt-4o': 'I\'m GPT-4o, an advanced AI model with enhanced capabilities. ',
    'claude-opus-4-20250514': 'I\'m Claude Opus 4, the most capable and intelligent model with superior reasoning. ',
    'claude-sonnet-4-20250514': 'I\'m Claude Sonnet 4, a high-performance model with exceptional reasoning and efficiency. ',
    'claude-3-5-haiku-20241022': 'I\'m Claude 3.5 Haiku, the fastest model for quick responses. ',
    'gemini-1.5-flash': 'I\'m Gemini 1.5 Flash, Google\'s fast AI assistant. ',
    'gemini-1.5-pro': 'I\'m Gemini 1.5 Pro, Google\'s advanced AI assistant. ',
    'deepseek-chat': 'I\'m DeepSeek Chat, designed for advanced reasoning and conversations. ',
    'deepseek-coder': 'I\'m DeepSeek Coder, specialized in coding and programming tasks. ',
  };

  // Handle OpenRouter models
  let modelIntro = modelPersonalities[model as keyof typeof modelPersonalities];
  if (!modelIntro) {
    if (model.includes('openai') || model.includes('gpt')) {
      modelIntro = `I'm ${model}, an OpenAI model accessed through OpenRouter. `;
    } else if (model.includes('claude') || model.includes('anthropic')) {
      modelIntro = `I'm ${model}, an Anthropic model accessed through OpenRouter. `;
    } else if (model.includes('gemini') || model.includes('google')) {
      modelIntro = `I'm ${model}, a Google model accessed through OpenRouter. `;
    } else if (model.includes('llama') || model.includes('meta')) {
      modelIntro = `I'm ${model}, a Meta model accessed through OpenRouter. `;
    } else {
      modelIntro = `I'm ${model}, an AI model accessed through OpenRouter. `;
    }
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `${modelIntro}Hello! How can I help you today?`;
  } 
  
  if (lowerMessage.includes('help')) {
    return `${modelIntro}I'm here to help! You can ask me questions about various topics, request assistance with tasks, or just have a conversation. What would you like to know?`;
  } 
  
  if (lowerMessage.includes('study') || lowerMessage.includes('learn')) {
    return `${modelIntro}I'd be happy to help you with your studies! What subject or topic would you like to explore? I can explain concepts, help with homework, or create study materials.`;
  }
  
  if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
    return `${modelIntro}I can help you with coding! Whether you need help debugging, learning a new language, or understanding programming concepts, I'm here to assist. What programming challenge are you working on?`;
  }
  
  if (reasoning) {
    return `${modelIntro}Let me think through this step by step:

1. You asked: "${message}"
2. This appears to be a ${lowerMessage.includes('?') ? 'question' : 'statement'} about ${extractMainTopic(message)}
3. Based on my analysis, here's my thoughtful response:

${generateDetailedResponse(message)}

This reasoning mode helps me provide more structured and thorough answers to complex queries.`;
  }

  // Generate contextual responses
  const responses = [
    `${modelIntro}That's an interesting point about "${message}". ${generateContextualResponse(lowerMessage)}`,
    `${modelIntro}I understand you're asking about "${message}". ${generateContextualResponse(lowerMessage)}`,
    `${modelIntro}Great question! Regarding "${message}", ${generateContextualResponse(lowerMessage)}`,
    `${modelIntro}Thank you for sharing that. In response to "${message}", ${generateContextualResponse(lowerMessage)}`,
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

const extractMainTopic = (message: string): string => {
  const topics = ['technology', 'science', 'education', 'programming', 'general inquiry'];
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('code') || lowerMessage.includes('program')) return 'programming';
  if (lowerMessage.includes('study') || lowerMessage.includes('learn')) return 'education';
  if (lowerMessage.includes('science') || lowerMessage.includes('research')) return 'science';
  if (lowerMessage.includes('tech') || lowerMessage.includes('computer')) return 'technology';
  
  return 'general inquiry';
};

const generateContextualResponse = (lowerMessage: string): string => {
  if (lowerMessage.includes('why')) {
    return "This is a great 'why' question. The reason behind this involves several factors that I'd be happy to explain in detail.";
  }
  if (lowerMessage.includes('how')) {
    return "Let me break down the process for you step by step to make it clear and actionable.";
  }
  if (lowerMessage.includes('what')) {
    return "Let me provide you with a comprehensive explanation that covers the key aspects you're asking about.";
  }
  return "I can provide you with detailed insights and practical information about this topic.";
};

const generateDetailedResponse = (message: string): string => {
  const topics = extractMainTopic(message);
  const responses = {
    'programming': 'This relates to software development practices and coding principles that are fundamental to creating efficient solutions.',
    'education': 'This connects to learning methodologies and educational strategies that can enhance understanding and retention.',
    'science': 'This involves scientific principles and research methodologies that help us understand the natural world.',
    'technology': 'This touches on technological innovations and digital solutions that are shaping our modern world.',
    'general inquiry': 'This is a thoughtful question that requires careful consideration of multiple perspectives and factors.'
  };
  
  return responses[topics as keyof typeof responses] || responses['general inquiry'];
};

// Mock functions with proper state management
export const createChatCompletion = async (params: CreateChatCompletionParams): Promise<ChatMessage> => {
  console.log('Creating chat completion with params:', params);
  
  // Simulate API delay (shorter for faster models, longer for more complex ones)
  const delays = {
    'gpt-4o-mini': 800,
    'claude-3-5-haiku-20241022': 700,
    'gpt-4o': 1500,
    'claude-sonnet-4-20250514': 1200,
    'claude-opus-4-20250514': 1800,
    'gemini-1.5-flash': 900,
    'gemini-1.5-pro': 1300,
    'deepseek-chat': 1100,
    'deepseek-coder': 1400,
  };
  
  // Default delay for OpenRouter models or unknown models
  let delay = delays[params.model as keyof typeof delays] || 1000;
  
  // Add extra delay for complex OpenRouter models
  if (params.model && !delays[params.model as keyof typeof delays]) {
    if (params.model.includes('gpt-4') || params.model.includes('claude-3-opus')) {
      delay = 1800;
    } else if (params.model.includes('llama') || params.model.includes('mixtral')) {
      delay = 1400;
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 1000));
  
  // Generate response based on model and reasoning
  const responseContent = generateModelResponse(params.message, params.model || 'gpt-4o-mini', params.reasoning);
  
  const newMessage: ChatMessage = {
    id: Math.random().toString(36).substr(2, 9),
    role: 'assistant',
    content: responseContent,
    createdAt: new Date().toISOString(),
  };
  
  // Store the user message first
  if (params.sessionId && mockMessages[params.sessionId]) {
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: params.message,
      createdAt: new Date().toISOString(),
    };
    mockMessages[params.sessionId].push(userMessage);
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
