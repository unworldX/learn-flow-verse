
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
  
  const [model, setModel] = useState(() =>
    localStorage.getItem('ai-model') || AI_PROVIDERS[PROVIDER_KEYS[0]].models[0]
  );

  useEffect(() => {
    if (user) {
      loadUserApiKeys();
    }
  }, [user]);

  const loadUserApiKeys = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('provider, encrypted_key, model')
        .eq('user_id', user.id);

      if (error) throw error;

      const keys: Record<string, string> = {};
      const models: Record<string, string> = {};
      
      data?.forEach((item: UserAPIKey) => {
        keys[item.provider + '_api_key'] = item.encrypted_key || '';
        if (item.model) {
          models[item.provider] = item.model;
        }
      });
      
      setApiKeys(keys);
      setSavedModels(models);

      if (models[provider]) {
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

  const saveApiKey = async (providerKey: string, newKey: string) => {
    if (!user) return;

    try {
      await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', providerKey);

      const { error } = await supabase
        .from('user_api_keys')
        .insert({
          user_id: user.id,
          provider: providerKey,
          encrypted_key: newKey.trim()
        });

      if (error) throw error;

      setApiKeys(prev => ({ ...prev, [AI_PROVIDERS[providerKey].keyName]: newKey }));
      
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
    if (AI_PROVIDERS[providerKey].fetchModels && dynamicModels[providerKey]) {
      return dynamicModels[providerKey];
    }
    return AI_PROVIDERS[providerKey].models;
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

    localStorage.setItem('ai-provider', provider);
    localStorage.setItem('ai-model', model);
    await saveModel(provider, model);

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
    clearAllApiKeys,
    saveSettings
  };
};
