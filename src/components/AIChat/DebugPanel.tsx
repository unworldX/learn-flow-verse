
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const DebugPanel = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const collectDebugInfo = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get localStorage data
      const localStorageData = {
        provider: localStorage.getItem('ai-provider'),
        model: localStorage.getItem('ai-model'),
      };

      // Get database data
      const { data: apiKeys, error } = await supabase
        .from('user_api_keys')
        .select('provider, encrypted_key, model')
        .eq('user_id', user.id);

      const debugData = {
        localStorage: localStorageData,
        database: {
          apiKeys: apiKeys?.map(key => ({
            provider: key.provider,
            hasKey: !!key.encrypted_key,
            keyLength: key.encrypted_key?.length || 0,
            model: key.model
          })) || [],
          error: error?.message
        },
        user: {
          id: user.id,
          email: user.email
        },
        timestamp: new Date().toISOString()
      };

      setDebugInfo(debugData);
    } catch (error) {
      console.error('Debug info collection error:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible && user) {
      collectDebugInfo();
    }
  }, [isVisible, user]);

  if (!user) return null;

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-yellow-800">
            Debug Panel
            <Badge variant="secondary" className="ml-2 text-xs">Development</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={collectDebugInfo}
              disabled={isLoading}
              className="text-yellow-700 hover:text-yellow-800"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className="text-yellow-700 hover:text-yellow-800"
            >
              {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isVisible && (
        <CardContent className="pt-0">
          <div className="text-xs space-y-2">
            <div>
              <strong>LocalStorage:</strong>
              <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto">
                {JSON.stringify(debugInfo.localStorage || {}, null, 2)}
              </pre>
            </div>
            
            <div>
              <strong>Database API Keys:</strong>
              <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto">
                {JSON.stringify(debugInfo.database || {}, null, 2)}
              </pre>
            </div>
            
            <div>
              <strong>User Info:</strong>
              <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto">
                {JSON.stringify(debugInfo.user || {}, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default DebugPanel;
