
import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ModelSelectorProps {
  models: string[];
  selectedModel: string;
  savedModel?: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
  providerName: string;
}

const ModelSelector = ({ 
  models, 
  selectedModel, 
  savedModel, 
  onModelChange, 
  disabled = false,
  providerName 
}: ModelSelectorProps) => {
  return (
    <div>
      <Label className="text-sm font-medium text-slate-800 mb-2 block">
        Default Model
        {savedModel && (
          <Badge variant="secondary" className="ml-2 text-xs">
            Saved: {savedModel}
          </Badge>
        )}
      </Label>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="w-full border-slate-200 rounded-xl h-11 px-3 text-base bg-white disabled:bg-gray-100 disabled:text-gray-500"
        disabled={disabled}
      >
        {models.length > 0 ? (
          models.map(model => (
            <option key={model} value={model}>{model}</option>
          ))
        ) : (
          <option value="">No models available</option>
        )}
      </select>
      {models.length === 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {providerName === 'OpenRouter' 
            ? 'Add API key and click "Refresh Models" to load available models' 
            : `No models configured for ${providerName}`
          }
        </p>
      )}
      {models.length > 0 && (
        <p className="text-xs text-gray-600 mt-1">
          {models.length} model{models.length !== 1 ? 's' : ''} available
        </p>
      )}
    </div>
  );
};

export default ModelSelector;
