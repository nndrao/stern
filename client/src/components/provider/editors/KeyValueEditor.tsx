/**
 * KeyValueEditor Component
 * Reusable component for editing key-value pairs (query params, headers, etc.)
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface KeyValueEditorProps {
  label: string;
  description?: string;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  label,
  description,
  value,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value'
}) => {
  // Convert Record to array for easier editing
  const pairs = Object.entries(value || {});

  const handleAdd = () => {
    const newKey = `key${pairs.length + 1}`;
    onChange({ ...value, [newKey]: '' });
  };

  const handleRemove = (keyToRemove: string) => {
    const newValue = { ...value };
    delete newValue[keyToRemove];
    onChange(newValue);
  };

  const handleKeyChange = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;

    const newValue = { ...value };
    const val = newValue[oldKey];
    delete newValue[oldKey];
    newValue[newKey] = val;
    onChange(newValue);
  };

  const handleValueChange = (key: string, newValue: string) => {
    onChange({ ...value, [key]: newValue });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="space-y-2">
        {pairs.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">
            No {label.toLowerCase()} configured
          </div>
        ) : (
          pairs.map(([key, val], index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={key}
                onChange={(e) => handleKeyChange(key, e.target.value)}
                placeholder={keyPlaceholder}
                className="flex-1"
              />
              <Input
                value={val}
                onChange={(e) => handleValueChange(key, e.target.value)}
                placeholder={valuePlaceholder}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(key)}
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add {label.replace(/s$/, '')}
      </Button>
    </div>
  );
};
