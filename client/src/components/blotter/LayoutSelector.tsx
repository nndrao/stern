/**
 * Layout Selector Component
 *
 * Allows users to:
 * - Switch between saved layouts
 * - Save current config as new layout
 * - Delete layouts
 * - Rename layouts
 */

import React, { useState } from 'react';
import { useOpenFinComponent, useOpenFinConfig } from '@/components/openfin/OpenFinComponent';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Save, Trash2 } from 'lucide-react';
import { logger } from '@/utils/logger';
import { ConfigVersion } from '@stern/shared-types';

export function LayoutSelector() {
  const { identity, broadcast } = useOpenFinComponent();
  const { fullConfig, reload, update } = useOpenFinConfig();
  const { toast } = useToast();

  const [selectedLayout, setSelectedLayout] = useState<string>('default');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');

  const layouts = fullConfig?.settings || [];

  const handleLayoutChange = async (layoutName: string) => {
    try {
      if (layoutName === 'default') {
        // Revert to default config by reloading from server
        await reload();
        logger.info('Reverted to default layout', { configId: identity.configId }, 'LayoutSelector');
      } else {
        // Find layout in settings array
        const layout = layouts.find(l => l.name === layoutName);
        if (layout) {
          // Apply layout by updating config
          await update({
            config: layout.config
          });

          logger.info('Applied layout', { layoutName, configId: identity.configId }, 'LayoutSelector');
        }
      }

      setSelectedLayout(layoutName);

      // Broadcast layout change to dialogs
      broadcast(`stern.grid.layoutChanged.${identity.configId}`, {
        layoutName,
        configId: identity.configId,
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'Layout applied',
        description: `Switched to "${layoutName}" layout`
      });
    } catch (error) {
      logger.error('Failed to apply layout', error, 'LayoutSelector');
      toast({
        title: 'Failed to apply layout',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handleSaveLayout = async () => {
    if (!newLayoutName.trim()) {
      toast({
        title: 'Invalid name',
        description: 'Please enter a layout name',
        variant: 'destructive'
      });
      return;
    }

    // Check if layout name already exists
    if (layouts.some(l => l.name === newLayoutName)) {
      toast({
        title: 'Layout exists',
        description: 'A layout with this name already exists',
        variant: 'destructive'
      });
      return;
    }

    try {
      const currentConfig = fullConfig?.config || {};

      const newLayout: ConfigVersion = {
        name: newLayoutName,
        version: `v${Date.now()}`,
        config: currentConfig,
        createdAt: new Date().toISOString(),
        createdBy: identity.uuid
      };

      // Add to settings array
      await update({
        settings: [...layouts, newLayout]
      });

      // Broadcast new layout created
      broadcast(`stern.grid.layoutCreated.${identity.configId}`, {
        layoutName: newLayoutName,
        configId: identity.configId,
        timestamp: new Date().toISOString()
      });

      logger.info('Layout saved', { layoutName: newLayoutName, configId: identity.configId }, 'LayoutSelector');

      toast({
        title: 'Layout saved',
        description: `Created layout "${newLayoutName}"`
      });

      setSaveDialogOpen(false);
      setNewLayoutName('');
      setSelectedLayout(newLayoutName);
    } catch (error) {
      logger.error('Failed to save layout', error, 'LayoutSelector');
      toast({
        title: 'Failed to save layout',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteLayout = async (layoutName: string) => {
    if (layoutName === 'default') {
      toast({
        title: 'Cannot delete default layout',
        variant: 'destructive'
      });
      return;
    }

    try {
      const updatedLayouts = layouts.filter(l => l.name !== layoutName);

      await update({
        settings: updatedLayouts
      });

      // Broadcast layout deleted
      broadcast(`stern.grid.layoutDeleted.${identity.configId}`, {
        layoutName,
        configId: identity.configId,
        timestamp: new Date().toISOString()
      });

      logger.info('Layout deleted', { layoutName, configId: identity.configId }, 'LayoutSelector');

      toast({
        title: 'Layout deleted',
        description: `Deleted layout "${layoutName}"`
      });

      // If deleted current layout, switch to default
      if (selectedLayout === layoutName) {
        setSelectedLayout('default');
        await handleLayoutChange('default');
      }
    } catch (error) {
      logger.error('Failed to delete layout', error, 'LayoutSelector');
      toast({
        title: 'Failed to delete layout',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Layout Selector */}
      <Select value={selectedLayout} onValueChange={handleLayoutChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select layout" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default</SelectItem>
          {layouts.map((layout) => (
            <SelectItem key={layout.name} value={layout.name}>
              {layout.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Save Layout Button */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" title="Save as new layout">
            <Save className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Layout</DialogTitle>
            <DialogDescription>
              Save the current grid configuration as a new layout
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="layout-name">Layout Name</Label>
              <Input
                id="layout-name"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder="e.g., My Custom Layout"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveLayout();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLayout}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Layout Button */}
      {selectedLayout !== 'default' && (
        <Button
          variant="outline"
          size="icon"
          title="Delete current layout"
          onClick={() => handleDeleteLayout(selectedLayout)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
