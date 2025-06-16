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

  // Normalize provider name consistently
  const normalizeProvider = (providerName: string): string => {
    return providerName.toLowerCase().trim();
  };

  useEffect(() => {
    if (user) {
      loadUserApiKeys();
    }
  }, [user]);

  useEffect(() => {
    const availableModels = getCurrentModels(provider);
    if (availableModels.length > 0) {
      const preferredModel = savedModels[normalizeProvider(provider)] || availableModels[0];
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
      
      console.log('Loaded API keys from database:', data?.map(item => ({ 
        provider: item.provider, 
        hasKey: !!item.encrypted_key,
        model: item.model 
      })));
      
      data?.forEach((item: UserAPIKey) => {
        if (item.encrypted_key && item.encrypted_key.trim()) {
          const normalizedProvider = normalizeProvider(item.provider);
          const keyName = AI_PROVIDERS[normalizedProvider]?.keyName || `${normalizedProvider}_api_key`;
          keys[keyName] = item.encrypted_key;
        }
        if (item.model) {
          const normalizedProvider = normalizeProvider(item.provider);
          models[normalizedProvider] = item.model;
        }
      });
      
      setApiKeys(keys);
      setSavedModels(models);

      // Auto-fetch models for providers that support it
      data?.forEach((item: UserAPIKey) => {
        const normalizedProvider = normalizeProvider(item.provider);
        if (normalizedProvider === 'openrouter' && item.encrypted_key) {
          fetchOpenRouterModels(item.encrypted_key);
        }
      });

      // Set default model if available and valid
      const normalizedCurrentProvider = normalizeProvider(provider);
      if (models[normalizedCurrentProvider] && getCurrentModels(provider).includes(models[normalizedCurrentProvider])) {
        setModel(models[normalizedCurrentProvider]);
        localStorage.setItem('ai-model', models[normalizedCurrentProvider]);
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
    const normalizedProvider = normalizeProvider(providerKey);
    
    if (!validateApiKey(normalizedProvider, trimmedKey)) {
      toast({
        title: "Invalid API key",
        description: `Please enter a valid ${AI_PROVIDERS[providerKey].name} API key.`,
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Saving API key for provider:', { original: providerKey, normalized: normalizedProvider });
      
      // Delete existing key for this provider using exact match
      await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', normalizedProvider);

      // Insert new key with normalized provider name
      const { error } = await supabase
        .from('user_api_keys')
        .insert({
          user_id: user.id,
          provider: normalizedProvider,
          encrypted_key: trimmedKey
        });

      if (error) throw error;

      const keyName = AI_PROVIDERS[providerKey]?.keyName || `${normalizedProvider}_api_key`;
      setApiKeys(prev => ({ ...prev, [keyName]: trimmedKey }));
      
      // Auto-fetch models for OpenRouter
      if (normalizedProvider === 'openrouter') {
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

  const validateApiKey = (provider: string, key: string): boolean => {
    if (!key || key.trim().length === 0) return false;
    
    const trimmedKey = key.trim();
    const normalizedProvider = normalizeProvider(provider);
    
    switch (normalizedProvider) {
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

  const saveModel = async (providerKey: string, modelToSave: string) => {
    if (!user) return;

    const normalizedProvider = providerKey.toLowerCase().trim();

    try {
      const { data: existingData, error: selectError } = await supabase
        .from('user_api_keys')
        .select('id')
        .eq('user_id', user.id)
        .ilike('provider', normalizedProvider)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existingData) {
        const { error } = await supabase
          .from('user_api_keys')
          .update({ model: modelToSave })
          .eq('user_id', user.id)
          .ilike('provider', normalizedProvider);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_api_keys')
          .insert({
            user_id: user.id,
            provider: normalizedProvider,
            encrypted_key: '',
            model: modelToSave
          });

        if (error) throw error;
      }

      setSavedModels(prev => ({ ...prev, [normalizedProvider]: modelToSave }));
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
    const normalizedProvider = providerKey.toLowerCase().trim();
    if (AI_PROVIDERS[providerKey]?.fetchModels && dynamicModels[normalizedProvider]?.length > 0) {
      return dynamicModels[normalizedProvider];
    }
    return AI_PROVIDERS[providerKey]?.models || [];
  };

  const getDefaultModel = (providerKey: string) => {
    const normalizedProvider = providerKey.toLowerCase().trim();
    const currentModels = getCurrentModels(providerKey);
    return savedModels[normalizedProvider] || currentModels[0] || '';
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

    // Ensure provider is normalized before saving
    const normalizedProvider = normalizeProvider(provider);
    
    const availableModels = getCurrentModels(provider);
    if (!availableModels.includes(model)) {
      const defaultModel = availableModels[0];
      setModel(defaultModel);
      localStorage.setItem('ai-model', defaultModel);
      await saveModel(normalizedProvider, defaultModel);
    } else {
      localStorage.setItem('ai-provider', normalizedProvider);
      localStorage.setItem('ai-model', model);
      await saveModel(normalizedProvider, model);
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
