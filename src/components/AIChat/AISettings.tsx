
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Bot } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_PROVIDERS = {
  openrouter: {
    name: 'OpenRouter',
    keyName: 'openrouter_api_key',
    models: [
      { id: 'microsoft/phi-4-reasoning-plus:free', name: 'Microsoft Phi-4 Reasoning Plus', free: true },
      { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 (0528)', free: true },
      { id: 'deepseek/deepseek-r1-0528-qwen3-8b:free', name: 'DeepSeek R1 Qwen3 8B', free: true },
      { id: 'google/gemma-3-27b-it:free', name: 'Google Gemma 3 27B IT', free: true }
    ]
  },
  openai: {
    name: 'OpenAI',
    keyName: 'openai_api_key',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', free: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', free: false },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', free: false },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', free: false }
    ]
  },
  anthropic: {
    name: 'Anthropic',
    keyName: 'anthropic_api_key',
    models: [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', free: false },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', free: false },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', free: false }
    ]
  },
  google: {
    name: 'Google AI',
    keyName: 'google_api_key',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro', free: false },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', free: false }
    ]
  },
  deepseek: {
    name: 'DeepSeek',
    keyName: 'deepseek_api_key',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', free: false },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', free: false }
    ]
  }
};

const AISettings = () => {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState(
    localStorage.getItem('ai_provider') || 'openrouter'
  );
  const [selectedModel, setSelectedModel] = useState(
    localStorage.getItem('ai_model') || 'microsoft/phi-4-reasoning-plus:free'
  );
  const [apiKeys, setApiKeys] = useState(() => {
    const keys: Record<string, string> = {};
    Object.values(API_PROVIDERS).forEach(provider => {
      keys[provider.keyName] = localStorage.getItem(provider.keyName) || '';
    });
    return keys;
  });
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    localStorage.setItem('ai_provider', provider);
    
    // Set default model for the provider
    const defaultModel = API_PROVIDERS[provider as keyof typeof API_PROVIDERS].models[0].id;
    setSelectedModel(defaultModel);
    localStorage.setItem('ai_model', defaultModel);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('ai_model', model);
  };

  const handleApiKeyChange = (keyName: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [keyName]: value }));
    localStorage.setItem(keyName, value);
  };

  const toggleApiKeyVisibility = (keyName: string) => {
    setShowApiKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const clearAllApiKeys = () => {
    Object.values(API_PROVIDERS).forEach(provider => {
      localStorage.removeItem(provider.keyName);
    });
    setApiKeys({});
    toast({
      title: "API Keys Cleared",
      description: "All API keys have been removed from local storage.",
    });
  };

  const currentProvider = API_PROVIDERS[selectedProvider as keyof typeof API_PROVIDERS];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-500" />
            AI Provider Settings
          </CardTitle>
          <CardDescription>
            Configure your AI provider, models, and API keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">AI Provider</Label>
            <Select value={selectedProvider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(API_PROVIDERS).map(([key, provider]) => (
                  <SelectItem key={key} value={key}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentProvider.models.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span>{model.name}</span>
                      {model.free && <Badge variant="secondary" className="text-xs">Free</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Keys */}
          <div className="space-y-4">
            <Label>API Keys</Label>
            {Object.entries(API_PROVIDERS).map(([key, provider]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={provider.keyName} className="text-sm font-medium">
                  {provider.name} API Key
                </Label>
                <div className="relative">
                  <Input
                    id={provider.keyName}
                    type={showApiKeys[provider.keyName] ? "text" : "password"}
                    placeholder={`Enter ${provider.name} API key`}
                    value={apiKeys[provider.keyName] || ''}
                    onChange={(e) => handleApiKeyChange(provider.keyName, e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => toggleApiKeyVisibility(provider.keyName)}
                  >
                    {showApiKeys[provider.keyName] ? 
                      <EyeOff className="h-4 w-4" /> : 
                      <Eye className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={clearAllApiKeys}>
              Clear All Keys
            </Button>
            <p className="text-xs text-muted-foreground">
              API keys are stored locally in your browser
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISettings;
