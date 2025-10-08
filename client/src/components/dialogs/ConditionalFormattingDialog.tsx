/**
 * Conditional Formatting Dialog
 *
 * Allows users to configure conditional formatting rules for the data grid.
 * Uses OpenFin IAB to communicate with parent window.
 *
 * Features:
 * - Create/edit/delete formatting rules
 * - Real-time preview
 * - IAB communication with parent window
 * - Auto-sync with config service
 */

import React, { useState, useEffect } from 'react';
import {
  OpenFinComponentProvider,
  useOpenFinComponent,
  useOpenFinConfig,
  useOpenFinIAB
} from '@/components/openfin/OpenFinComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Save } from 'lucide-react';
import { logger } from '@/utils/logger';

// Types for conditional formatting rules
interface ConditionalFormattingRule {
  id: string;
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains';
  value: string | number;
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
}

interface GridConfig {
  conditionalFormatting?: ConditionalFormattingRule[];
  // Other grid config properties...
}

function ConditionalFormattingDialogContent() {
  const { identity, broadcast, updateConfig } = useOpenFinComponent();
  const { config, isLoading } = useOpenFinConfig<GridConfig>();
  const { toast } = useToast();

  const [rules, setRules] = useState<ConditionalFormattingRule[]>([]);

  // Load rules from config on mount
  useEffect(() => {
    if (config?.conditionalFormatting) {
      setRules(config.conditionalFormatting);
      logger.debug('Loaded conditional formatting rules', {
        ruleCount: config.conditionalFormatting.length
      }, 'ConditionalFormattingDialog');
    }
  }, [config]);

  // Listen for config updates from parent window
  useOpenFinIAB(
    `stern.grid.configUpdated.${identity.configId}`,
    (message) => {
      if (message.payload?.changes?.conditionalFormatting) {
        setRules(message.payload.changes.conditionalFormatting);
        logger.debug('Received config update from parent', message, 'ConditionalFormattingDialog');
      }
    },
    []
  );

  const handleAddRule = () => {
    const newRule: ConditionalFormattingRule = {
      id: `rule-${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      backgroundColor: '#ffff00',
      textColor: '#000000',
      fontWeight: 'normal'
    };

    setRules([...rules, newRule]);
  };

  const handleUpdateRule = (index: number, updates: Partial<ConditionalFormattingRule>) => {
    const updatedRules = [...rules];
    updatedRules[index] = { ...updatedRules[index], ...updates };
    setRules(updatedRules);
  };

  const handleDeleteRule = (index: number) => {
    const updatedRules = rules.filter((_, i) => i !== index);
    setRules(updatedRules);
  };

  const handleSave = async () => {
    try {
      // Update config on server
      await updateConfig({
        config: {
          ...config,
          conditionalFormatting: rules
        }
      });

      // Broadcast to parent window
      broadcast(`stern.dialog.saved.${identity.configId}`, {
        type: 'conditionalFormatting',
        payload: { conditionalFormatting: rules },
        timestamp: new Date().toISOString()
      });

      logger.info('Conditional formatting saved', {
        configId: identity.configId,
        ruleCount: rules.length
      }, 'ConditionalFormattingDialog');

      toast({
        title: 'Formatting saved',
        description: `Saved ${rules.length} rule(s)`
      });
    } catch (error) {
      logger.error('Failed to save conditional formatting', error, 'ConditionalFormattingDialog');

      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Conditional Formatting</h2>
        <p className="text-sm text-muted-foreground">
          Configure formatting rules for grid cells
        </p>
      </div>

      {/* Rules List */}
      <div className="flex-1 overflow-auto p-4">
        {rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No formatting rules configured</p>
            <p className="text-sm mt-2">Click "Add Rule" to create one</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Rule {index + 1}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRule(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Field */}
                  <div className="space-y-2">
                    <Label>Field</Label>
                    <Input
                      value={rule.field}
                      onChange={(e) => handleUpdateRule(index, { field: e.target.value })}
                      placeholder="e.g., price"
                    />
                  </div>

                  {/* Operator */}
                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <Select
                      value={rule.operator}
                      onValueChange={(value: any) => handleUpdateRule(index, { operator: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="notEquals">Not Equals</SelectItem>
                        <SelectItem value="greaterThan">Greater Than</SelectItem>
                        <SelectItem value="lessThan">Less Than</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value */}
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      value={rule.value}
                      onChange={(e) => handleUpdateRule(index, { value: e.target.value })}
                      placeholder="e.g., 100"
                    />
                  </div>

                  {/* Background Color */}
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <Input
                      type="color"
                      value={rule.backgroundColor}
                      onChange={(e) => handleUpdateRule(index, { backgroundColor: e.target.value })}
                    />
                  </div>

                  {/* Text Color */}
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <Input
                      type="color"
                      value={rule.textColor}
                      onChange={(e) => handleUpdateRule(index, { textColor: e.target.value })}
                    />
                  </div>

                  {/* Font Weight */}
                  <div className="space-y-2">
                    <Label>Font Weight</Label>
                    <Select
                      value={rule.fontWeight}
                      onValueChange={(value: any) => handleUpdateRule(index, { fontWeight: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-4 flex items-center justify-between">
        <Button variant="outline" onClick={handleAddRule} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>

        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}

export interface ConditionalFormattingDialogProps {
  configId?: string;
}

/**
 * Conditional Formatting Dialog - Main export
 */
export function ConditionalFormattingDialog({ configId }: ConditionalFormattingDialogProps) {
  return (
    <OpenFinComponentProvider
      configId={configId}
      autoLoadConfig={true}
      autoSetupIAB={true}
      onReady={(identity) => {
        logger.info('ConditionalFormattingDialog ready', identity, 'ConditionalFormattingDialog');

        // Notify parent that dialog opened
        // Note: broadcast is not available here, so we'll do it in the content component
      }}
    >
      <ConditionalFormattingDialogContent />
    </OpenFinComponentProvider>
  );
}
