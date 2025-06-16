
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Bot, Shield, Trash2, Save, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAISettings } from '@/hooks/useAISettings';
import { AI_PROVIDERS, PROVIDER_KEYS } from '@/config/aiProviders';
import SecureKeyManager from './SecureKeyManager';
import ProviderCard from './ProviderCard';
import ModelSelector from './ModelSelector';
import ProviderHealthCheck from './ProviderHealthCheck';
import SmartDefaults from './SmartDefaults';

const AISettings = () => {
  const { user } = useAuth();
  const {
    apiKeys,
    savedModels,
    dynamicModels,
    isLoading,
    fetchingModels,
    provider,
    model,
    setProvider,
    setModel,
    saveApiKey,
    fetchOpenRouterModels,
    getCurrentModels,
    getDefaultModel,
    clearAllApiKeys,
    saveSettings
  } = useAISettings();

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

  const [isSaving, setIsSaving] = useState(false);

  const openSecureKeyManager = (providerKey: string) => {
    const providerConfig = AI_PROVIDERS[providerKey];
    setSecureKeyManager({
      isOpen: true,
      provider: providerKey,
      providerName: providerConfig.name,
      currentKey: apiKeys[providerConfig.keyName] || ''
    });
  };

  const handleKeySaved = async (providerKey: string, newKey: string) => {
    await saveApiKey(providerKey, newKey);
    
    if (providerKey === 'openrouter' && newKey.trim()) {
      fetchOpenRouterModels(newKey.trim());
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await saveSettings();
    setIsSaving(false);
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    // Auto-select the best available model for this provider
    const availableModels = getCurrentModels(newProvider);
    const bestModel = getDefaultModel(newProvider);
    if (bestModel && availableModels.includes(bestModel)) {
      setModel(bestModel);
    } else if (availableModels.length > 0) {
      setModel(availableModels[0]);
    }
  };

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
              Please sign in to manage your AI keys securely.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SmartDefaults 
        onProviderChange={setProvider}
        onModelChange={setModel}
        apiKeys={apiKeys}
      />
      
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Bot className="w-5 h-5" />
            AI Provider Settings
          </CardTitle>
          <CardDescription className="text-blue-700">
            Configure your AI provider and model. API keys are stored securely and hidden after saving.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 bg-white/70 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-800">Security & Privacy</h4>
                <p className="text-sm text-blue-700">
                  Your API keys are encrypted and stored securely. Authentication is required to edit them.
                </p>
              </div>
            </div>
          </div>

          {/* Current Settings Summary */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-2">Current Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Active Provider:</span>
                <span className="ml-2 font-medium text-slate-800">{AI_PROVIDERS[provider]?.name || 'None'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Status:</span>
                <ProviderHealthCheck provider={provider} model={model} />
              </div>
            </div>
          </div>

          <Tabs value={provider} onValueChange={handleProviderChange}>
            <TabsList className="grid grid-cols-5 w-full mb-6">
              {PROVIDER_KEYS.map(p => (
                <TabsTrigger 
                  key={p}
                  value={p}
                  className="rounded-xl font-medium capitalize"
                >
                  {AI_PROVIDERS[p].name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {PROVIDER_KEYS.map((p) => (
              <TabsContent value={p} key={p}>
                <div className="space-y-4">
                  <ProviderCard
                    provider={AI_PROVIDERS[p]}
                    hasApiKey={!!apiKeys[AI_PROVIDERS[p].keyName]}
                    onEditKey={() => openSecureKeyManager(p)}
                    onRefreshModels={p === 'openrouter' ? () => fetchOpenRouterModels(apiKeys[AI_PROVIDERS[p].keyName]) : undefined}
                    isRefreshing={fetchingModels[p]}
                    modelCount={dynamicModels[p]?.length}
                  />
                  
                  <ModelSelector
                    models={getCurrentModels(p)}
                    selectedModel={provider === p ? model : getDefaultModel(p)}
                    savedModel={savedModels[p]}
                    onModelChange={(newModel) => {
                      if (provider === p) {
                        setModel(newModel);
                      }
                    }}
                    disabled={provider !== p}
                    providerName={AI_PROVIDERS[p].name}
                  />
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
              onClick={handleSaveSettings}
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
            API keys are encrypted and securely stored. Authentication required to edit keys.
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
