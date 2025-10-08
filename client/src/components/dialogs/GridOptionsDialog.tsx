/**
 * Grid Options Dialog
 *
 * Allows users to configure grid display options:
 * - Row height
 * - Theme/styling
 * - Pagination
 * - Animation settings
 * - Selection mode
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Save } from 'lucide-react';
import { logger } from '@/utils/logger';

interface GridOptions {
  rowHeight?: number;
  headerHeight?: number;
  animateRows?: boolean;
  enableRangeSelection?: boolean;
  enableCharts?: boolean;
  rowSelection?: 'single' | 'multiple';
  pagination?: boolean;
  paginationPageSize?: number;
  suppressRowHoverHighlight?: boolean;
  suppressCellFocus?: boolean;
  enableCellTextSelection?: boolean;
}

interface GridConfig {
  gridOptions?: GridOptions;
}

function GridOptionsDialogContent() {
  const { identity, broadcast, updateConfig } = useOpenFinComponent();
  const { config, isLoading } = useOpenFinConfig<GridConfig>();
  const { toast } = useToast();

  const [options, setOptions] = useState<GridOptions>({
    rowHeight: 42,
    headerHeight: 48,
    animateRows: true,
    enableRangeSelection: true,
    enableCharts: true,
    rowSelection: 'multiple',
    pagination: false,
    paginationPageSize: 100,
    suppressRowHoverHighlight: false,
    suppressCellFocus: false,
    enableCellTextSelection: true,
  });

  // Load options from config
  useEffect(() => {
    if (config?.gridOptions) {
      setOptions({ ...options, ...config.gridOptions });
    }
  }, [config]);

  // Listen for config updates from parent
  useOpenFinIAB(
    `stern.grid.configUpdated.${identity.configId}`,
    (message) => {
      if (message.payload?.changes?.gridOptions) {
        setOptions({ ...options, ...message.payload.changes.gridOptions });
      }
    },
    []
  );

  const handleOptionChange = <K extends keyof GridOptions>(
    key: K,
    value: GridOptions[K]
  ) => {
    setOptions({ ...options, [key]: value });
  };

  const handleSave = async () => {
    try {
      await updateConfig({
        config: {
          ...config,
          gridOptions: options
        }
      });

      broadcast(`stern.dialog.saved.${identity.configId}`, {
        type: 'gridOptions',
        payload: { gridOptions: options },
        timestamp: new Date().toISOString()
      });

      logger.info('Grid options saved', {
        configId: identity.configId,
        options
      }, 'GridOptionsDialog');

      toast({
        title: 'Options saved',
        description: 'Grid options have been updated'
      });
    } catch (error) {
      logger.error('Failed to save grid options', error, 'GridOptionsDialog');

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
        <h2 className="text-lg font-semibold">Grid Options</h2>
        <p className="text-sm text-muted-foreground">
          Configure grid display and behavior settings
        </p>
      </div>

      {/* Options Form */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-6 max-w-2xl">
          {/* Row Sizing */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Row Sizing</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rowHeight">Row Height (px)</Label>
                <Input
                  id="rowHeight"
                  type="number"
                  value={options.rowHeight}
                  onChange={(e) => handleOptionChange('rowHeight', Number(e.target.value))}
                  min={20}
                  max={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="headerHeight">Header Height (px)</Label>
                <Input
                  id="headerHeight"
                  type="number"
                  value={options.headerHeight}
                  onChange={(e) => handleOptionChange('headerHeight', Number(e.target.value))}
                  min={20}
                  max={200}
                />
              </div>
            </div>
          </div>

          {/* Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Selection</h3>

            <div className="space-y-2">
              <Label htmlFor="rowSelection">Row Selection Mode</Label>
              <Select
                value={options.rowSelection}
                onValueChange={(value: 'single' | 'multiple') => handleOptionChange('rowSelection', value)}
              >
                <SelectTrigger id="rowSelection">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="multiple">Multiple</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableRangeSelection"
                checked={options.enableRangeSelection}
                onCheckedChange={(checked) =>
                  handleOptionChange('enableRangeSelection', checked as boolean)
                }
              />
              <Label htmlFor="enableRangeSelection" className="text-sm cursor-pointer">
                Enable range selection (Excel-like)
              </Label>
            </div>
          </div>

          {/* Pagination */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Pagination</h3>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="pagination"
                checked={options.pagination}
                onCheckedChange={(checked) =>
                  handleOptionChange('pagination', checked as boolean)
                }
              />
              <Label htmlFor="pagination" className="text-sm cursor-pointer">
                Enable pagination
              </Label>
            </div>

            {options.pagination && (
              <div className="space-y-2">
                <Label htmlFor="paginationPageSize">Page Size</Label>
                <Input
                  id="paginationPageSize"
                  type="number"
                  value={options.paginationPageSize}
                  onChange={(e) => handleOptionChange('paginationPageSize', Number(e.target.value))}
                  min={10}
                  max={1000}
                  step={10}
                />
              </div>
            )}
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Features</h3>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="animateRows"
                  checked={options.animateRows}
                  onCheckedChange={(checked) =>
                    handleOptionChange('animateRows', checked as boolean)
                  }
                />
                <Label htmlFor="animateRows" className="text-sm cursor-pointer">
                  Animate row changes
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableCharts"
                  checked={options.enableCharts}
                  onCheckedChange={(checked) =>
                    handleOptionChange('enableCharts', checked as boolean)
                  }
                />
                <Label htmlFor="enableCharts" className="text-sm cursor-pointer">
                  Enable charts (AG-Grid Enterprise)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableCellTextSelection"
                  checked={options.enableCellTextSelection}
                  onCheckedChange={(checked) =>
                    handleOptionChange('enableCellTextSelection', checked as boolean)
                  }
                />
                <Label htmlFor="enableCellTextSelection" className="text-sm cursor-pointer">
                  Enable cell text selection
                </Label>
              </div>
            </div>
          </div>

          {/* Styling */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Styling</h3>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="suppressRowHoverHighlight"
                  checked={options.suppressRowHoverHighlight}
                  onCheckedChange={(checked) =>
                    handleOptionChange('suppressRowHoverHighlight', checked as boolean)
                  }
                />
                <Label htmlFor="suppressRowHoverHighlight" className="text-sm cursor-pointer">
                  Disable row hover highlight
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="suppressCellFocus"
                  checked={options.suppressCellFocus}
                  onCheckedChange={(checked) =>
                    handleOptionChange('suppressCellFocus', checked as boolean)
                  }
                />
                <Label htmlFor="suppressCellFocus" className="text-sm cursor-pointer">
                  Disable cell focus border
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4 flex items-center justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}

export interface GridOptionsDialogProps {
  configId?: string;
}

export function GridOptionsDialog({ configId }: GridOptionsDialogProps) {
  return (
    <OpenFinComponentProvider
      configId={configId}
      autoLoadConfig={true}
      autoSetupIAB={true}
      onReady={(identity) => {
        logger.info('GridOptionsDialog ready', identity, 'GridOptionsDialog');
      }}
    >
      <GridOptionsDialogContent />
    </OpenFinComponentProvider>
  );
}
