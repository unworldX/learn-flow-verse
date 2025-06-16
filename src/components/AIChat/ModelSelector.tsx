
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
        className="w-full border-slate-200 rounded-xl h-11 px-3 text-base bg-white"
        disabled={disabled}
      >
        {models.map(model => (
          <option key={model} value={model}>{model}</option>
        ))}
      </select>
      {models.length === 0 && (
        <p className="text-xs text-gray-500 mt-1">
          Click "Refresh Models" to load available models for {providerName}
        </p>
      )}
    </div>
  );
};

export default ModelSelector;
