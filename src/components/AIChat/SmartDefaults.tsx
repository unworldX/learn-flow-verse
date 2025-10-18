import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AI_PROVIDERS } from '@/config/aiProviders';

interface SmartDefaultsProps {
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  apiKeys: Record<string, string>;
}

const SmartDefaults = ({ onProviderChange, onModelChange, apiKeys }: SmartDefaultsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && Object.keys(apiKeys).length > 0) {
      setupSmartDefaults();
    }
  }, [user, apiKeys]);

  const setupSmartDefaults = () => {
    // Find the best available provider based on priority
    const providerPriority = ['openai', 'anthropic', 'google', 'deepseek', 'openrouter'];
    
    let bestProvider = null;
    for (const provider of providerPriority) {
      const keyName = AI_PROVIDERS[provider]?.keyName;
      if (keyName && apiKeys[keyName]) {
        bestProvider = provider;
        break;
      }
    }

    if (bestProvider) {
      const currentProvider = localStorage.getItem('ai-provider');
      const currentModel = localStorage.getItem('ai-model');
      
      // Only set defaults if nothing is configured or current config is invalid
      if (!currentProvider || !apiKeys[AI_PROVIDERS[currentProvider]?.keyName]) {
        onProviderChange(bestProvider);
        
        // Set best model for this provider
        const bestModel = getBestModel(bestProvider);
        if (bestModel) {
          onModelChange(bestModel);
        }
        
        toast({
          title: "Smart defaults applied",
          description: `Configured ${AI_PROVIDERS[bestProvider].name} as your default provider.`,
        });
      }
    }
  };

  const getBestModel = (provider: string): string => {
    const models = AI_PROVIDERS[provider]?.models || [];
    
    // Priority-based model selection
    const modelPriority: Record<string, string[]> = {
      openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
      anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
      google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
      deepseek: ['deepseek-chat', 'deepseek-coder'],
      openrouter: models // Use first available for OpenRouter
    };

    const preferredModels = modelPriority[provider] || models;
    
    for (const model of preferredModels) {
      if (models.includes(model)) {
        return model;
      }
    }
    
    return models[0] || '';
  };

  return null; // This is a logic component, no UI
};

export default SmartDefaults;
