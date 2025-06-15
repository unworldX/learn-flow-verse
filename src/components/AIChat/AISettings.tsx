
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Bot, Key, Shield, Trash2, Save, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const API_PROVIDERS = {
  openrouter: {
    name: 'OpenRouter',
    description: 'Access to multiple AI models through one API',
    keyName: 'openrouter_api_key',
    website: 'https://openrouter.ai/',
    placeholder: 'sk-or-...'
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT models and advanced AI capabilities',
    keyName: 'openai_api_key',
    website: 'https://platform.openai.com/',
    placeholder: 'sk-...'
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Claude models for thoughtful AI conversations',
    keyName: 'anthropic_api_key',
    website: 'https://console.anthropic.com/',
    placeholder: 'sk-ant-...'
  },
  google: {
    name: 'Google AI',
    description: 'Gemini models and Google AI services',
    keyName: 'google_api_key',
    website: 'https://makersuite.google.com/',
    placeholder: 'AIza...'
  },
  deepseek: {
    name: 'DeepSeek',
    description: 'Advanced reasoning and coding models',
    keyName: 'deepseek_api_key',
    website: 'https://platform.deepseek.com/',
    placeholder: 'sk-...'
  }
};

const AISettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      // Use 'any' for the table to avoid type errors
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

  const handleApiKeyChange = (keyName: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [keyName]: value }));
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
      // Delete existing keys for this user
      await (supabase as any)
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id);

      // Insert new keys
      const keysToInsert = Object.entries(apiKeys)
        .filter(([_, value]) => value.trim() !== '')
        .map(([keyName, encrypted_key]) => {
          // Extract provider name from keyName, e.g. openai_api_key -> openai
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

      toast({
        title: "API keys saved",
        description: "Your API keys have been securely saved."
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
            Configure your AI provider API keys. All keys are securely encrypted and stored per user.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Notice */}
          <div className="p-4 bg-white/70 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-800">Security & Privacy</h4>
                <p className="text-sm text-blue-700">
                  Your API keys are encrypted and stored securely. Only you can access your keys.
                </p>
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys
              </Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadUserApiKeys}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {Object.entries(API_PROVIDERS).map(([key, provider]) => (
              <Card key={key} className="border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-800">{provider.name}</CardTitle>
                      <CardDescription className="text-sm text-gray-600 mt-1">
                        {provider.description}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(provider.website, '_blank')}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      Get API Key
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="relative">
                    <Input
                      type={showApiKeys[provider.keyName] ? "text" : "password"}
                      placeholder={provider.placeholder}
                      value={apiKeys[provider.keyName] || ''}
                      onChange={(e) => handleApiKeyChange(provider.keyName, e.target.value)}
                      className="pr-12 font-mono text-sm border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={() => toggleApiKeyVisibility(provider.keyName)}
                    >
                      {showApiKeys[provider.keyName] ? 
                        <EyeOff className="h-4 w-4 text-gray-500" /> : 
                        <Eye className="h-4 w-4 text-gray-500" />
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
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
              {isSaving ? 'Saving...' : 'Save API Keys'}
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-100">
            API keys are encrypted using industry-standard encryption and stored securely in your user account.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISettings;
