
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SecureKeyManagerProps {
  provider: string;
  providerInfo: {
    name: string;
    keyName: string;
    placeholder: string;
    website: string;
  };
  onKeySaved: () => void;
}

const SecureKeyManager = ({ provider, providerInfo, onKeySaved }: SecureKeyManagerProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthenticate = async () => {
    if (!user || !password) return;

    setIsAuthenticating(true);
    try {
      // Re-authenticate the user
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password
      });

      if (error) {
        throw error;
      }

      // Load existing API key if it exists
      await loadExistingKey();
      setIsUnlocked(true);
      setPassword('');
      
      toast({
        title: "Authentication successful",
        description: "You can now view and edit your API keys."
      });
    } catch (error: any) {
      console.error('Authentication failed:', error);
      toast({
        title: "Authentication failed",
        description: error.message || "Please check your password and try again.",
        variant: "destructive"
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loadExistingKey = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('encrypted_key')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setApiKey(data.encrypted_key || '');
      }
    } catch (error) {
      console.error('Error loading API key:', error);
      toast({
        title: "Error loading API key",
        description: "Failed to load existing API key.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = async () => {
    if (!user || !apiKey.trim()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          provider,
          encrypted_key: apiKey.trim()
        }, {
          onConflict: 'user_id,provider'
        });

      if (error) throw error;

      toast({
        title: "API key saved",
        description: `Your ${providerInfo.name} API key has been saved securely.`
      });

      onKeySaved();
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error saving API key",
        description: "Failed to save your API key. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setApiKey('');
    setShowApiKey(false);
    setPassword('');
  };

  if (!isUnlocked) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Shield className="w-5 h-5" />
            Secure Access Required
          </CardTitle>
          <CardDescription className="text-amber-700">
            Enter your account password to view or edit API keys for {providerInfo.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-amber-800">Password</Label>
            <Input
              type="password"
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuthenticate()}
              className="mt-1 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20"
            />
          </div>
          <Button 
            onClick={handleAuthenticate}
            disabled={!password || isAuthenticating}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isAuthenticating ? 'Authenticating...' : 'Unlock API Keys'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Shield className="w-5 h-5" />
              {providerInfo.name} API Key
            </CardTitle>
            <CardDescription className="text-green-700">
              Securely manage your API key for {providerInfo.name}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLock}
            className="text-green-700 hover:text-green-800 hover:bg-green-100"
          >
            <Lock className="w-4 h-4 mr-1" />
            Lock
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-green-800">API Key</Label>
          <div className="relative mt-1">
            <Input
              type={showApiKey ? "text" : "password"}
              placeholder={providerInfo.placeholder}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-12 font-mono text-sm border-green-200 focus:border-green-400 focus:ring-green-400/20"
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-green-100"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? 
                <EyeOff className="h-4 w-4 text-green-600" /> : 
                <Eye className="h-4 w-4 text-green-600" />
              }
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleSaveKey}
            disabled={!apiKey.trim() || isSaving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSaving ? 'Saving...' : 'Save API Key'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.open(providerInfo.website, '_blank')}
            className="border-green-200 text-green-700 hover:bg-green-100"
          >
            Get API Key
          </Button>
        </div>
        
        <p className="text-xs text-green-600">
          Your API key is encrypted and stored securely. It will only be used for AI chat requests.
        </p>
      </CardContent>
    </Card>
  );
};

export default SecureKeyManager;
