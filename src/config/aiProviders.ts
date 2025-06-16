
import { AIProvider } from '@/types/ai';

export const AI_PROVIDERS: Record<string, AIProvider> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4.1-2025-04-14', 'o4-mini-2025-04-16', 'o3-2025-04-16', 'gpt-4o-mini', 'gpt-4o'],
    description: 'GPT models and advanced AI capabilities',
    keyName: 'openai_api_key',
    website: 'https://platform.openai.com/',
    placeholder: 'sk-...',
    fetchModels: false
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-opus-4-20250514', 'claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
    description: 'Claude models for thoughtful AI conversations',
    keyName: 'anthropic_api_key',
    website: 'https://console.anthropic.com/',
    placeholder: 'sk-ant-...',
    fetchModels: false
  },
  google: {
    id: 'google',
    name: 'Google AI',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-8b'],
    description: 'Gemini models and Google AI services',
    keyName: 'google_api_key',
    website: 'https://makersuite.google.com/',
    placeholder: 'AIza...',
    fetchModels: false
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    description: 'Advanced reasoning and coding models',
    keyName: 'deepseek_api_key',
    website: 'https://platform.deepseek.com/',
    placeholder: 'sk-...',
    fetchModels: false
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    models: ['google/gemma-3n-e4b-it:free', 'meta-llama/llama-3.2-3b-instruct:free', 'microsoft/phi-3-mini-128k-instruct:free'],
    description: 'Access to multiple AI models through OpenRouter',
    keyName: 'openrouter_api_key',
    website: 'https://openrouter.ai/',
    placeholder: 'sk-or-...',
    fetchModels: true
  }
};

export const PROVIDER_KEYS = Object.keys(AI_PROVIDERS);
