
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, Edit, RefreshCw, Loader2 } from 'lucide-react';
import { AIProvider } from '@/types/ai';

interface ProviderCardProps {
  provider: AIProvider;
  hasApiKey: boolean;
  onEditKey: () => void;
  onRefreshModels?: () => void;
  isRefreshing?: boolean;
  modelCount?: number;
}

const ProviderCard = ({ 
  provider, 
  hasApiKey, 
  onEditKey, 
  onRefreshModels,
  isRefreshing = false,
  modelCount 
}: ProviderCardProps) => {
  return (
    <Card className="border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              {provider.name}
              {provider.fetchModels && (
                <Badge variant="secondary" className="text-xs">Real-time Models</Badge>
              )}
            </CardTitle>
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
        <div className="flex items-center gap-2">
          {hasApiKey ? (
            <>
              <div className="flex-1 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">API Key Configured</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onEditKey}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </>
          ) : (
            <Button
              onClick={onEditKey}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Key className="w-4 h-4 mr-2" />
              Add API Key
            </Button>
          )}
        </div>
        
        {provider.fetchModels && hasApiKey && onRefreshModels && (
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onRefreshModels}
              disabled={isRefreshing}
              className="text-xs"
            >
              {isRefreshing ? (
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
            {modelCount && (
              <span className="text-xs text-gray-600">
                {modelCount} models available
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderCard;
