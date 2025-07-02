
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProviderHealthCheckProps {
  provider: string;
  model: string;
}

type HealthStatus = 'checking' | 'healthy' | 'error' | 'warning';

const ProviderHealthCheck = ({ provider, model }: ProviderHealthCheckProps) => {
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    checkProviderHealth();
  }, [provider, model, user]);

  const checkProviderHealth = async () => {
    if (!user) {
      setStatus('warning');
      setMessage('Sign in required');
      return;
    }

    setStatus('checking');

    try {
      // Check if API key exists
      const { data: apiKeyData, error } = await supabase
        .from('user_api_keys')
        .select('encrypted_key')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .maybeSingle();

      if (error || !apiKeyData?.encrypted_key) {
        setStatus('error');
        setMessage('No API key configured');
        return;
      }

      // Test with a simple request
      const { data, error: testError } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: 'Hello',
          provider,
          model,
          reasoning: false,
          userId: user.id
        }
      });

      if (testError || data?.error) {
        setStatus('error');
        setMessage(testError?.message || data?.error || 'Connection failed');
      } else {
        setStatus('healthy');
        setMessage('Ready');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Health check failed');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'healthy':
        return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-3 h-3 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-3 h-3 text-red-600" />;
    }
  };

  const getStatusVariant = () => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getStatusVariant()} className="gap-1 text-xs">
      {getStatusIcon()}
      {message}
    </Badge>
  );
};

export default ProviderHealthCheck;
