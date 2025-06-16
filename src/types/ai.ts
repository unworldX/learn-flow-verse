
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
