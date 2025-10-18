export interface AIProvider {
  id: string;
  name: string;
  models: string[];
  description: string;
  keyName: string;
  website: string;
  placeholder: string;
  fetchModels: boolean;
}

export interface AIMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface AISettings {
  provider: string;
  model: string;
  reasoning: boolean;
}

export interface UserAPIKey {
  id: string;
  provider: string;
  encrypted_key: string;
  model?: string;
}

// Persistent chat types
export interface PersistedChatMessage {
  id?: string; // uuid from DB
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface ChatSessionSummary {
  id: string;
  derived_title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string | null;
}

export interface ChatSessionDetail {
  session: { id: string; title: string | null; created_at: string; updated_at?: string };
  messages: PersistedChatMessage[];
}
