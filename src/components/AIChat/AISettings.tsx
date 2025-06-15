
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Bot, Shield, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SecureKeyManager from './SecureKeyManager';

const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o-mini', 'gpt-4o'],
    description: 'GPT models and advanced AI capabilities',
    keyName: 'openai_api_key',
    website: 'https://platform.openai.com/',
    placeholder: 'sk-...',
    fetchModels: false
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    description: 'Claude models for thoughtful AI conversations',
    keyName: 'anthropic_api_key',
    website: 'https://console.anthropic.com/',
    placeholder: 'sk-ant-...',
    fetchModels: false
  },
  google: {
    name: 'Google AI',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    description: 'Gemini models and Google AI services',
    keyName: 'google_api_key',
    website: 'https://makersuite.google.com/',
    placeholder: 'AIza...',
    fetchModels: false
  },
  deepseek: {
    name: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-coder'],
    description: 'Advanced reasoning and coding models',
    keyName: 'deepseek_api_key',
    website: 'https://platform.deepseek.com/',
    placeholder: 'sk-...',
    fetchModels: false
  },
  openrouter: {
    name: 'OpenRouter',
    models: [], // Will be fetched dynamically
    description: 'Access to multiple AI models through OpenRouter',
    keyName: 'openrouter_api_key',
    website: 'https://openrouter.ai/',
    placeholder: 'sk-or-...',
    fetchModels: true
  }
};

const ALL_PROVIDER_KEYS = Object.keys(AI_PROVIDERS);

const AISettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [savedProviders, setSavedProviders] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({});
  const [dynamicModels, setDynamicModels] = useState<Record<string, string[]>>({});

  // Provider/model selection
  const [provider, setProvider] = useState(() =>
    localStorage.getItem('ai-provider') || ALL_PROVIDER_KEYS[0]
  );
  const [model, setModel] = useState(() =>
    localStorage.getItem('ai-model') ||
    AI_PROVIDERS[localStorage.getItem('ai-provider') as keyof typeof AI_PROVIDERS]?.models[0] ||
    AI_PROVIDERS[ALL_PROVIDER_KEYS[0]].models[0]
  );

  // Load saved providers
  useEffect(() => {
    if (user) {
      loadSavedProviders();
    }
  }, [user]);

  const loadSavedProviders = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('provider')
        .eq('user_id', user.id);

      if (error) throw error;

      const providers = data?.map(item => item.provider) || [];
      setSavedProviders(providers);
    } catch (error) {
      console.error('Error loading saved providers:', error);
    } finally {
      setIsLoading(false);
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

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

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

  const saveSettings = () => {
    localStorage.setItem('ai-provider', provider);
    localStorage.setItem('ai-model', model);
    toast({
      title: "Settings saved",
      description: "Your AI provider and model preferences have been saved."
    });
  };

  // Update models when provider changes
  useEffect(() => {
    const currentModels = getCurrentModels(provider);
    if (!currentModels.includes(model)) {
      setModel(currentModels[0] || '');
    }
  }, [provider, dynamicModels]);

  if (!user) {
    return (
      <div className="space-y-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Shield className="w-5 h-5" />
              Authentication Required
            </CardTitle>
            <CardDescription className="text-amber-700">
              Please sign in to manage your AI settings and API keys securely.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Bot className="w-5 h-5" />
            AI Provider Settings
          </CardTitle>
          <CardDescription className="text-blue-700">
            Configure your AI provider, model preferences, and securely manage API keys.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 bg-white/70 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-800">Security & Privacy</h4>
                <p className="text-sm text-blue-700">
                  Your API keys are encrypted and stored securely. Access requires password re-authentication.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Settings */}
          <div className="space-y-4 p-4 bg-white rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-800">Quick Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ALL_PROVIDER_KEYS.map(p => (
                    <option key={p} value={p}>
                      {AI_PROVIDERS[p].name}
                      {savedProviders.includes(p) ? ' ✓' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getCurrentModels(provider).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <Button 
              onClick={saveSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Preferences
            </Button>
          </div>

          {/* API Key Management */}
          <Tabs value={provider} onValueChange={setProvider}>
            <TabsList className="grid grid-cols-5 w-full mb-6">
              {ALL_PROVIDER_KEYS.map(p => (
                <TabsTrigger 
                  key={p}
                  value={p}
                  className="rounded-xl font-medium capitalize"
                >
                  {AI_PROVIDERS[p].name}
                  {savedProviders.includes(p) && (
                    <Badge variant="secondary" className="ml-1 text-xs">✓</Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {ALL_PROVIDER_KEYS.map((p) => (
              <TabsContent value={p} key={p}>
                <SecureKeyManager
                  provider={p}
                  providerInfo={AI_PROVIDERS[p]}
                  onKeySaved={loadSavedProviders}
                />
                
                {AI_PROVIDERS[p].fetchModels && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Model Management</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // This would need the API key, but we can't access it from here
                        // The user would need to unlock first and provide the key
                        toast({
                          title: "Unlock API key first",
                          description: "Please unlock your API key to refresh models.",
                          variant: "default"
                        });
                      }}
                      disabled={fetchingModels[p]}
                      className="text-xs"
                    >
                      {fetchingModels[p] ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Refresh Models
                        </>
                      )}
                    </Button>
                    {dynamicModels[p] && (
                      <p className="text-xs text-gray-600 mt-2">
                        {dynamicModels[p].length} models available
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-100">
            All API keys are encrypted and stored securely. Password re-authentication is required to view or modify keys.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISettings;
