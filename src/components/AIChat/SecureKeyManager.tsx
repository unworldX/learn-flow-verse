
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface SecureKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  provider: string;
  providerName: string;
  currentKey: string;
  onKeySaved: (key: string) => void;
}

const SecureKeyManager = ({ 
  isOpen, 
  onClose, 
  provider, 
  providerName, 
  currentKey,
  onKeySaved 
}: SecureKeyManagerProps) => {
  const [password, setPassword] = useState('');
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAuthenticate = async () => {
    if (!user || !password) return;

    setIsAuthenticating(true);
    try {
      // Re-authenticate the user with their password
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password
      });

      if (error) {
        throw error;
      }

      setIsAuthenticated(true);
      setNewKey(currentKey);
      toast({
        title: "Authentication successful",
        description: "You can now edit your API key."
      });
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: "Please check your password and try again.",
        variant: "destructive"
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSaveKey = async () => {
    if (!user || !newKey.trim()) return;

    setIsSaving(true);
    try {
      // Delete existing key for this provider
      await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider);

      // Insert new key
      const { error } = await supabase
        .from('user_api_keys')
        .insert({
          user_id: user.id,
          provider,
          encrypted_key: newKey.trim()
        });

      if (error) throw error;

      onKeySaved(newKey.trim());
      toast({
        title: "API key saved",
        description: `Your ${providerName} API key has been saved securely.`
      });
      onClose();
    } catch (error: any) {
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

  const handleClose = () => {
    setPassword('');
    setNewKey('');
    setIsAuthenticated(false);
    setShowKey(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Edit {providerName} API Key
          </DialogTitle>
          <DialogDescription>
            For security, please re-authenticate to edit your API key.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isAuthenticated ? (
            <>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  onKeyPress={(e) => e.key === 'Enter' && handleAuthenticate()}
                />
              </div>
              <Button 
                onClick={handleAuthenticate}
                disabled={!password || isAuthenticating}
                className="w-full"
              >
                {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="api-key">{providerName} API Key</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showKey ? "text" : "password"}
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveKey}
                  disabled={!newKey.trim() || isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : 'Save Key'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SecureKeyManager;
