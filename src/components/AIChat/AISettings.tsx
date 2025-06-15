import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Eye, EyeOff, Bot, Key, Shield, Trash2, Save, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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
    models: ['claude-opus-4-20250514', 'claude-sonnet-4-20250514'],
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
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({});
  const [dynamicModels, setDynamicModels] = useState<Record<string, string[]>>({});

  // New: Provider/model selection
  const [provider, setProvider] = useState(() =>
    localStorage.getItem('ai-provider') || ALL_PROVIDER_KEYS[0]
  );
  const [model, setModel] = useState(() =>
    localStorage.getItem('ai-model') ||
    AI_PROVIDERS[localStorage.getItem('ai-provider') as keyof typeof AI_PROVIDERS]?.models[0] ||
    AI_PROVIDERS[ALL_PROVIDER_KEYS[0]].models[0]
  );

  // Load API keys for the current user
  useEffect(() => {
    if (user) {
      loadUserApiKeys();
    }
  }, [user]);

  const loadUserApiKeys = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('user_api_keys')
        .select('provider, encrypted_key')
        .eq('user_id', user.id);

      if (error) throw error;

      const keys: Record<string, string> = {};
      data?.forEach((item: any) => {
        keys[item.provider + '_api_key'] = item.encrypted_key || '';
      });
      setApiKeys(keys);
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

  const handleApiKeyChange = (keyName: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [keyName]: value }));
    
    // Auto-fetch models for OpenRouter when API key is entered
    if (keyName === 'openrouter_api_key' && value.trim().length > 10) {
      fetchOpenRouterModels(value.trim());
    }
  };

  const getCurrentModels = (providerKey: string) => {
    if (AI_PROVIDERS[providerKey].fetchModels && dynamicModels[providerKey]) {
      return dynamicModels[providerKey];
    }
    return AI_PROVIDERS[providerKey].models;
  };

  const saveApiKeys = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save API keys.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await (supabase as any)
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id);

      const keysToInsert = Object.entries(apiKeys)
        .filter(([_, value]) => value.trim() !== '')
        .map(([keyName, encrypted_key]) => {
          const provider = keyName.replace('_api_key', '');
          return {
            user_id: user.id,
            provider,
            encrypted_key
          };
        });

      if (keysToInsert.length > 0) {
        const { error } = await (supabase as any)
          .from('user_api_keys')
          .insert(keysToInsert);
        if (error) throw error;
      }

      localStorage.setItem('ai-provider', provider);
      localStorage.setItem('ai-model', model);

      toast({
        title: "Settings saved",
        description: "Your AI settings and keys have been saved."
      });
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        title: "Error saving API keys",
        description: "Failed to save your API keys. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleApiKeyVisibility = (keyName: string) => {
    setShowApiKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const clearAllApiKeys = async () => {
    if (!user) return;
    try {
      await (supabase as any)
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id);

      setApiKeys({});
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
              Please sign in to manage your API keys securely.
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
            Configure your AI provider, preferred model, and API keys. Models are fetched in real-time for supported providers.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 bg-white/70 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-800">Security & Privacy</h4>
                <p className="text-sm text-blue-700">
                  Your API keys are encrypted and stored securely. Models are fetched dynamically when available.
                </p>
              </div>
            </div>
          </div>

          {/* Provider Setting Toggle */}
          <Tabs value={provider} onValueChange={setProvider}>
            <TabsList className="grid grid-cols-5 w-full mb-6">
              {ALL_PROVIDER_KEYS.map(p => (
                <TabsTrigger 
                  key={p}
                  value={p}
                  className="rounded-xl font-medium capitalize"
                >
                  {AI_PROVIDERS[p].name}
                </TabsTrigger>
              ))}
            </TabsList>
            {ALL_PROVIDER_KEYS.map((p) => (
              <TabsContent value={p} key={p}>
                <div className="space-y-4">
                  <Card className="border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            {AI_PROVIDERS[p].name}
                            {AI_PROVIDERS[p].fetchModels && (
                              <Badge variant="secondary" className="text-xs">Real-time Models</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600 mt-1">
                            {AI_PROVIDERS[p].description}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(AI_PROVIDERS[p].website, '_blank')}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >Get API Key</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="relative">
                        <Input
                          type={showApiKeys[AI_PROVIDERS[p].keyName] ? "text" : "password"}
                          placeholder={AI_PROVIDERS[p].placeholder}
                          value={apiKeys[AI_PROVIDERS[p].keyName] || ''}
                          onChange={(e) => handleApiKeyChange(AI_PROVIDERS[p].keyName, e.target.value)}
                          className="pr-12 font-mono text-sm border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => toggleApiKeyVisibility(AI_PROVIDERS[p].keyName)}
                        >
                          {showApiKeys[AI_PROVIDERS[p].keyName] ? 
                            <EyeOff className="h-4 w-4 text-gray-500" /> : 
                            <Eye className="h-4 w-4 text-gray-500" />
                          }
                        </Button>
                      </div>
                      {AI_PROVIDERS[p].fetchModels && apiKeys[AI_PROVIDERS[p].keyName] && (
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fetchOpenRouterModels(apiKeys[AI_PROVIDERS[p].keyName])}
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
                            <span className="text-xs text-gray-600">
                              {dynamicModels[p].length} models available
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  {/* Model select */}
                  <div>
                    <Label className="text-sm font-medium text-slate-800">Default Model</Label>
                    <select
                      value={provider === p ? model : getCurrentModels(p)[0]}
                      onChange={e => setModel(e.target.value)}
                      className="mt-2 w-full border-slate-200 rounded-xl h-11 px-3 text-base"
                      disabled={provider !== p}
                    >
                      {getCurrentModels(p).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {AI_PROVIDERS[p].fetchModels && !dynamicModels[p] && apiKeys[AI_PROVIDERS[p].keyName] && (
                      <p className="text-xs text-gray-500 mt-1">
                        Enter API key and refresh to load available models
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={clearAllApiKeys}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Keys
            </Button>
            
            <Button 
              onClick={saveApiKeys}
              disabled={isSaving || isLoading}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
          <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-100">
            API keys and model selection are encrypted and securely stored. Models are fetched in real-time for supported providers.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISettings;
