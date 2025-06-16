import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AI_PROVIDERS, PROVIDER_KEYS } from '@/config/aiProviders';
import { UserAPIKey } from '@/types/ai';

export const useAISettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [savedModels, setSavedModels] = useState<Record<string, string>>({});
  const [dynamicModels, setDynamicModels] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({});

  const [provider, setProvider] = useState(() =>
    localStorage.getItem('ai-provider') || PROVIDER_KEYS[0]
  );
  
  const [model, setModel] = useState(() => {
    const savedModel = localStorage.getItem('ai-model');
    const currentProvider = localStorage.getItem('ai-provider') || PROVIDER_KEYS[0];
    return savedModel || AI_PROVIDERS[currentProvider].models[0] || '';
  });

  useEffect(() => {
    if (user) {
      loadUserApiKeys();
    }
  }, [user]);

  // Update model when provider changes
  useEffect(() => {
    const availableModels = getCurrentModels(provider);
    if (availableModels.length > 0) {
      const preferredModel = savedModels[provider] || availableModels[0];
      setModel(preferredModel);
      localStorage.setItem('ai-model', preferredModel);
    }
  }, [provider, savedModels, dynamicModels]);

  const loadUserApiKeys = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('id, provider, encrypted_key, model')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading API keys:', error);
        throw error;
      }

      const keys: Record<string, string> = {};
      const models: Record<string, string> = {};
      
      data?.forEach((item: UserAPIKey) => {
        if (item.encrypted_key && item.encrypted_key.trim()) {
          keys[item.provider + '_api_key'] = item.encrypted_key;
        }
        if (item.model) {
          models[item.provider] = item.model;
        }
      });
      
      setApiKeys(keys);
      setSavedModels(models);

      // Auto-fetch models for providers that support it
      data?.forEach((item: UserAPIKey) => {
        if (item.provider === 'openrouter' && item.encrypted_key) {
          fetchOpenRouterModels(item.encrypted_key);
        }
      });

      // Set default model if available and valid
      if (models[provider] && getCurrentModels(provider).includes(models[provider])) {
        setModel(models[provider]);
        localStorage.setItem('ai-model', models[provider]);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast({
        title: "Error loading API keys",
        description: "Failed to load your saved API keys.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateApiKey = (provider: string, key: string): boolean => {
    if (!key || key.trim().length === 0) return false;
    
    const trimmedKey = key.trim();
    
    switch (provider) {
      case 'openai':
        return trimmedKey.startsWith('sk-') && trimmedKey.length > 20;
      case 'anthropic':
        return trimmedKey.startsWith('sk-ant-') && trimmedKey.length > 20;
      case 'google':
        return trimmedKey.startsWith('AIza') && trimmedKey.length > 20;
      case 'deepseek':
        return trimmedKey.startsWith('sk-') && trimmedKey.length > 20;
      case 'openrouter':
        return trimmedKey.startsWith('sk-or-') && trimmedKey.length > 20;
      default:
        return trimmedKey.length > 10;
    }
  };

  const saveApiKey = async (providerKey: string, newKey: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save API keys.",
        variant: "destructive"
      });
      return;
    }

    const trimmedKey = newKey.trim();
    
    if (!validateApiKey(providerKey, trimmedKey)) {
      toast({
        title: "Invalid API key",
        description: `Please enter a valid ${AI_PROVIDERS[providerKey].name} API key.`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Delete existing key for this provider
      await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', providerKey);

      // Insert new key
      const { error } = await supabase
        .from('user_api_keys')
        .insert({
          user_id: user.id,
          provider: providerKey,
          encrypted_key: trimmedKey
        });

      if (error) throw error;

      setApiKeys(prev => ({ ...prev, [AI_PROVIDERS[providerKey].keyName]: trimmedKey }));
      
      // Auto-fetch models for OpenRouter
      if (providerKey === 'openrouter') {
        fetchOpenRouterModels(trimmedKey);
      }
      
      toast({
        title: "API key saved",
        description: `Your ${AI_PROVIDERS[providerKey].name} API key has been saved securely.`
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error saving API key",
        description: "Failed to save your API key. Please try again.",
        variant: "destructive"
      });
    }
  };

  const saveModel = async (providerKey: string, modelToSave: string) => {
    if (!user) return;

    try {
      const { data: existingData, error: selectError } = await supabase
        .from('user_api_keys')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', providerKey)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existingData) {
        const { error } = await supabase
          .from('user_api_keys')
          .update({ model: modelToSave })
          .eq('user_id', user.id)
          .eq('provider', providerKey);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_api_keys')
          .insert({
            user_id: user.id,
            provider: providerKey,
            encrypted_key: '',
            model: modelToSave
          });

        if (error) throw error;
      }

      setSavedModels(prev => ({ ...prev, [providerKey]: modelToSave }));
    } catch (error) {
      console.error('Error saving model:', error);
      toast({
        title: "Error saving model",
        description: "Failed to save model selection.",
        variant: "destructive"
      });
    }
  };

  const fetchOpenRouterModels = async (apiKey: string) => {
    setFetchingModels(prev => ({ ...prev, openrouter: true }));
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch models');

      const data = await response.json();
      const modelIds = data.data?.map((model: any) => model.id) || [];
      
      setDynamicModels(prev => ({ ...prev, openrouter: modelIds }));
      
      toast({
        title: "Models loaded",
        description: `Fetched ${modelIds.length} OpenRouter models`,
      });
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      toast({
        title: "Error fetching models",
        description: "Failed to load OpenRouter models. Check your API key.",
        variant: "destructive"
      });
    } finally {
      setFetchingModels(prev => ({ ...prev, openrouter: false }));
    }
  };

  const getCurrentModels = (providerKey: string) => {
    if (AI_PROVIDERS[providerKey].fetchModels && dynamicModels[providerKey]?.length > 0) {
      return dynamicModels[providerKey];
    }
    return AI_PROVIDERS[providerKey].models;
  };

  const getDefaultModel = (providerKey: string) => {
    const currentModels = getCurrentModels(providerKey);
    return savedModels[providerKey] || currentModels[0] || '';
  };

  const clearAllApiKeys = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id);

      setApiKeys({});
      setSavedModels({});
      setDynamicModels({});
      
      // Reset to default values
      const defaultProvider = PROVIDER_KEYS[0];
      const defaultModel = AI_PROVIDERS[defaultProvider].models[0];
      setProvider(defaultProvider);
      setModel(defaultModel);
      localStorage.setItem('ai-provider', defaultProvider);
      localStorage.setItem('ai-model', defaultModel);
      
      toast({
        title: "API Keys Cleared",
        description: "All API keys have been removed."
      });
    } catch (error) {
      console.error('Error clearing API keys:', error);
      toast({
        title: "Error clearing API keys",
        description: "Failed to clear API keys. Please try again.",
        variant: "destructive"
      });
    }
  };

  const saveSettings = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save settings.",
        variant: "destructive"
      });
      return;
    }

    // Validate current model exists in available models
    const availableModels = getCurrentModels(provider);
    if (!availableModels.includes(model)) {
      const defaultModel = availableModels[0];
      setModel(defaultModel);
      localStorage.setItem('ai-model', defaultModel);
      await saveModel(provider, defaultModel);
    } else {
      localStorage.setItem('ai-provider', provider);
      localStorage.setItem('ai-model', model);
      await saveModel(provider, model);
    }

    toast({
      title: "Settings saved",
      description: "Your AI provider and model settings have been saved."
    });
  };

  return {
    apiKeys,
    savedModels,
    dynamicModels,
    isLoading,
    fetchingModels,
    provider,
    model,
    setProvider,
    setModel,
    loadUserApiKeys,
    saveApiKey,
    saveModel,
    fetchOpenRouterModels,
    getCurrentModels,
    getDefaultModel,
    clearAllApiKeys,
    saveSettings
  };
};
