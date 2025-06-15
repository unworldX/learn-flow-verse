import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Bot, Key, Shield, Trash2, Save, RefreshCw, Loader2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SecureKeyManager from './SecureKeyManager';
import { Input } from '@/components/ui/input';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({});
  const [dynamicModels, setDynamicModels] = useState<Record<string, string[]>>({});
  const [secureKeyManager, setSecureKeyManager] = useState<{
    isOpen: boolean;
    provider: string;
    providerName: string;
    currentKey: string;
  }>({
    isOpen: false,
    provider: '',
    providerName: '',
    currentKey: ''
  });

  // Provider/model selection
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
      const { data, error } = await supabase
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

  const getCurrentModels = (providerKey: string) => {
    if (AI_PROVIDERS[providerKey].fetchModels && dynamicModels[providerKey]) {
      return dynamicModels[providerKey];
    }
    return AI_PROVIDERS[providerKey].models;
  };

  const openSecureKeyManager = (providerKey: string) => {
    const provider = AI_PROVIDERS[providerKey];
    setSecureKeyManager({
      isOpen: true,
      provider: providerKey,
      providerName: provider.name,
      currentKey: apiKeys[provider.keyName] || ''
    });
  };

  const handleKeySaved = (providerKey: string, newKey: string) => {
    const keyName = AI_PROVIDERS[providerKey].keyName;
    setApiKeys(prev => ({ ...prev, [keyName]: newKey }));
    
    // Auto-fetch models for OpenRouter when API key is saved
    if (providerKey === 'openrouter' && newKey.trim()) {
      fetchOpenRouterModels(newKey.trim());
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

    setIsSaving(true);
    try {
      localStorage.setItem('ai-provider', provider);
      localStorage.setItem('ai-model', model);

      toast({
        title: "Settings saved",
        description: "Your AI provider and model settings have been saved."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const clearAllApiKeys = async () => {
    if (!user) return;
    try {
      await supabase
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
            Configure your AI provider and model. API keys are always visible here and must be edited securely.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 bg-white/70 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-800">Security & Privacy</h4>
                <p className="text-sm text-blue-700">
                  Your API keys are encrypted in the database. Authentication is required to edit them.
                </p>
              </div>
            </div>
          </div>

          {/* Provider Settings */}
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
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-slate-700 font-medium">API Key</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Input
                              className="flex-1 text-mono"
                              value={apiKeys[AI_PROVIDERS[p].keyName] || ''}
                              readOnly
                              type="password"
                              placeholder={AI_PROVIDERS[p].placeholder}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openSecureKeyManager(p)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
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
                    <label className="text-sm font-medium text-slate-800 mb-2 block">Default Model</label>
                    <select
                      value={provider === p ? model : getCurrentModels(p)[0]}
                      onChange={e => setModel(e.target.value)}
                      className="w-full border-slate-200 rounded-xl h-11 px-3 text-base bg-white"
                      disabled={provider !== p}
                    >
                      {getCurrentModels(p).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {AI_PROVIDERS[p].fetchModels && !dynamicModels[p] && apiKeys[AI_PROVIDERS[p].keyName] && (
                      <p className="text-xs text-gray-500 mt-1">
                        Click "Refresh Models" to load available models
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
              onClick={saveSettings}
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
            API keys are visible here and require authentication to edit.
          </div>
        </CardContent>
      </Card>

      <SecureKeyManager
        isOpen={secureKeyManager.isOpen}
        onClose={() => setSecureKeyManager(prev => ({ ...prev, isOpen: false }))}
        provider={secureKeyManager.provider}
        providerName={secureKeyManager.providerName}
        currentKey={secureKeyManager.currentKey}
        onKeySaved={(key) => handleKeySaved(secureKeyManager.provider, key)}
      />
    </div>
  );
};

export default AISettings;
