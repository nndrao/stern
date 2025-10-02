/**
 * Dock Configuration Editor Component
 * Main interface for editing dock menu configurations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useToast } from '@/components/ui/use-toast';
import {
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Copy,
  Undo,
  Redo,
  Eye,
  AlertCircle
} from 'lucide-react';

import { TreeView } from './TreeView';
import { PropertiesPanel } from './PropertiesPanel';
import { IconPicker } from './IconPicker';
import { DockConfiguration, createMenuItem, validateDockConfiguration } from '@/types/dockConfig';
import { useDockConfigStore } from '@/stores/dockConfigStore';
import { useOpenFinDock } from '@/hooks/useOpenFinWorkspace';
import '@/utils/testApi'; // Import test utility for debugging
import { logger } from '@/utils/logger';

interface DockConfigEditorProps {
  userId?: string;
  appId?: string;
}

export const DockConfigEditor: React.FC<DockConfigEditorProps> = ({
  userId = 'default-user',
  appId = 'stern-platform'
}) => {
  const { toast } = useToast();
  const openFinDock = useOpenFinDock();
  const store = useDockConfigStore();

  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerCallback, setIconPickerCallback] = useState<((icon: string) => void) | null>(null);

  // Load configuration on mount
  useEffect(() => {
    store.loadConfig(userId);
  }, [userId, store]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!store.isDirty) return;

    const timer = setTimeout(() => {
      handleSaveDraft();
    }, 30000);

    return () => clearTimeout(timer);
  }, [store.isDirty, store.currentConfig, handleSaveDraft]);

  const handleSaveDraft = useCallback(() => {
    if (store.currentConfig) {
      localStorage.setItem('dock-config-draft', JSON.stringify(store.currentConfig));
      toast({
        title: 'Draft saved',
        description: 'Your changes have been saved locally',
      });
    }
  }, [store.currentConfig, toast]);

  const handleSave = useCallback(async () => {
    logger.debug('Save button clicked', undefined, 'DockConfigEditor');

    if (!store.currentConfig) {
      logger.error('No current config available', undefined, 'DockConfigEditor');
      toast({
        title: 'Error',
        description: 'No configuration loaded',
        variant: 'destructive'
      });
      return;
    }

    // Validate configuration before saving
    const validation = validateDockConfiguration(store.currentConfig);
    logger.debug('Validation result', validation, 'DockConfigEditor');

    if (!validation.isValid) {
      logger.warn('Validation failed', validation.errors, 'DockConfigEditor');
      toast({
        title: 'Validation failed',
        description: validation.errors[0]?.message || 'Please fix validation errors',
        variant: 'destructive'
      });
      return;
    }

    const menuItemCount = store.currentConfig.config?.menuItems?.length || 0;
    const configName = store.currentConfig.name;

    try {
      logger.info('Calling store.saveConfig()', undefined, 'DockConfigEditor');
      await store.saveConfig();

      // Check if save actually succeeded by checking the error state
      if (store.error) {
        throw new Error(store.error);
      }

      logger.info('Save completed successfully', undefined, 'DockConfigEditor');

      // Reload the dock to show the updated configuration
      if (window.fin) {
        try {
          logger.info('Reloading dock with updated configuration...', undefined, 'DockConfigEditor');
          const { Dock } = await import('@openfin/workspace');
          const { registerDockFromConfig, showDock } = await import('@/platform/dock');

          // Deregister current dock
          await Dock.deregister();

          // Re-register with updated config
          if (store.currentConfig) {
            await registerDockFromConfig(store.currentConfig);
            await showDock();
            logger.info('Dock reloaded successfully', undefined, 'DockConfigEditor');
          }
        } catch (dockError) {
          logger.warn('Failed to reload dock, may require manual reload', dockError, 'DockConfigEditor');
        }
      }

      toast({
        title: 'Configuration saved successfully',
        description: `Saved "${configName}" with ${menuItemCount} menu item(s). Dock has been reloaded.`,
      });
    } catch (error) {
      logger.error('Save failed in component', error, 'DockConfigEditor');
      const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration';
      toast({
        title: 'Save failed',
        description: `Could not save "${configName}": ${errorMessage}`,
        variant: 'destructive'
      });
    }
  }, [store, toast]);

  const handleAddMenuItem = useCallback(() => {
    const parent = store.selectedNode;
    store.addMenuItem(parent || undefined);
  }, [store]);

  const handleDeleteMenuItem = useCallback(() => {
    if (store.selectedNode) {
      store.deleteMenuItem(store.selectedNode.id);
      toast({
        title: 'Item deleted',
        description: 'Menu item has been removed',
      });
    }
  }, [store, toast]);

  const handleDuplicateMenuItem = useCallback(() => {
    if (store.selectedNode) {
      const duplicate = createMenuItem({
        ...store.selectedNode,
        id: undefined,
        caption: `${store.selectedNode.caption} (Copy)`
      });
      store.addMenuItem(undefined, duplicate);
      toast({
        title: 'Item duplicated',
        description: 'Menu item has been duplicated',
      });
    }
  }, [store, toast]);

  const handlePreview = useCallback(async () => {
    if (!store.currentConfig) return;

    try {
      // Update dock with current configuration
      await openFinDock.updateDock(store.currentConfig.config);
      await openFinDock.showDock();
      toast({
        title: 'Preview updated',
        description: 'Dock has been updated with your changes',
      });
    } catch (error) {
      toast({
        title: 'Preview failed',
        description: 'Failed to update dock preview',
        variant: 'destructive'
      });
    }
  }, [store.currentConfig, openFinDock, toast]);

  const handleExport = useCallback(() => {
    if (!store.currentConfig) return;

    const dataStr = JSON.stringify(store.currentConfig, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `dock-config-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: 'Configuration exported',
      description: 'Configuration has been downloaded',
    });
  }, [store.currentConfig, toast]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        store.setConfig(config);
        toast({
          title: 'Configuration imported',
          description: 'Configuration has been loaded successfully',
        });
      } catch (error) {
        toast({
          title: 'Import failed',
          description: 'Invalid configuration file',
          variant: 'destructive'
        });
      }
    };
    reader.readAsText(file);
  }, [store, toast]);

  const handleIconSelect = useCallback((callback: (icon: string) => void) => {
    setIconPickerCallback(() => callback);
    setIsIconPickerOpen(true);
  }, []);

  const handleIconPicked = useCallback((icon: string) => {
    if (iconPickerCallback) {
      iconPickerCallback(icon);
    }
    setIsIconPickerOpen(false);
    setIconPickerCallback(null);
  }, [iconPickerCallback]);

  return (
    <div className="h-full flex flex-col">
      {/* Header Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold">Dock Configuration</h1>
            <p className="text-sm text-muted-foreground">
              Configure menu items and submenus for your dock
            </p>
          </div>
          <div className="flex items-center gap-2">
            {store.isDirty && (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Unsaved changes
              </Badge>
            )}
            {store.isLoading && (
              <Badge variant="outline" className="gap-1">
                Loading...
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddMenuItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteMenuItem}
              disabled={!store.selectedNode}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicateMenuItem}
              disabled={!store.selectedNode}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>

            <Separator orientation="vertical" className="mx-2 h-6" />

            <Button
              variant="outline"
              size="sm"
              onClick={() => store.undo()}
              disabled={!store.canUndo}
            >
              <Undo className="h-4 w-4 mr-2" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => store.redo()}
              disabled={!store.canRedo}
            >
              <Redo className="h-4 w-4 mr-2" />
              Redo
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>

            <label htmlFor="import-file">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </span>
              </Button>
            </label>
            <input
              id="import-file"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Separator orientation="vertical" className="mx-2 h-6" />

            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!store.isDirty || store.isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {store.error && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{store.error}</AlertDescription>
          </Alert>
        )}

        {!store.currentConfig ? (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>No Configuration</CardTitle>
                <CardDescription>
                  Create a new dock configuration to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => store.createNewConfig(userId, appId)}>
                  Create New Configuration
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={40} minSize={30}>
              <div className="h-full p-4 overflow-auto">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Menu Structure</CardTitle>
                    <CardDescription>
                      Drag and drop to reorder items
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TreeView
                      items={store.currentConfig.config.menuItems}
                      selectedId={store.selectedNode?.id}
                      onSelect={(item) => store.selectNode(item)}
                      onReorder={(sourceId, targetId, position) =>
                        store.reorderItems(sourceId, targetId, position)
                      }
                      onUpdate={(id, updates) => store.updateMenuItem(id, updates)}
                    />
                  </CardContent>
                </Card>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={60} minSize={40}>
              <div className="h-full p-4 overflow-auto">
                {store.selectedNode ? (
                  <PropertiesPanel
                    item={store.selectedNode}
                    onUpdate={(updates) =>
                      store.updateMenuItem(store.selectedNode!.id, updates)
                    }
                    onIconSelect={handleIconSelect}
                  />
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent>
                      <p className="text-muted-foreground text-center">
                        Select a menu item to edit its properties
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* Icon Picker Dialog */}
      <IconPicker
        open={isIconPickerOpen}
        onOpenChange={setIsIconPickerOpen}
        onSelect={handleIconPicked}
      />
    </div>
  );
};