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
  Eye,
  AlertCircle
} from 'lucide-react';

import { TreeView } from './TreeView';
import { PropertiesPanel } from './PropertiesPanel';
import { IconPicker } from './IconPicker';
import { DockConfiguration, DockMenuItem, createMenuItem, validateDockConfiguration, createDockConfiguration } from '@/openfin/types/dockConfig';
import { useDockConfig, useSaveDockConfig } from '@/hooks/useDockConfigQueries';
import { useOpenFinDock } from '@/openfin/hooks/useOpenfinWorkspace';
import { useOpenfinTheme } from '@/openfin/hooks/useOpenfinTheme';
import '@/utils/testApi'; // Import test utility for debugging
import { logger } from '@/utils/logger';
import { COMPONENT_SUBTYPES } from '@stern/shared-types';

interface DockConfigEditorProps {
  userId?: string;
  appId?: string;
}

// Helper: Find menu item by ID recursively
function findMenuItem(items: DockMenuItem[], id: string): DockMenuItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findMenuItem(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Helper: Update menu item recursively
function updateMenuItemRecursive(items: DockMenuItem[], id: string, updates: Partial<DockMenuItem>): DockMenuItem[] {
  return items.map(item => {
    if (item.id === id) {
      return { ...item, ...updates };
    }
    if (item.children) {
      return {
        ...item,
        children: updateMenuItemRecursive(item.children, id, updates)
      };
    }
    return item;
  });
}

// Helper: Delete menu item recursively
function deleteMenuItemRecursive(items: DockMenuItem[], id: string): DockMenuItem[] {
  const result: DockMenuItem[] = [];
  for (const item of items) {
    if (item.id !== id) {
      if (item.children) {
        result.push({
          ...item,
          children: deleteMenuItemRecursive(item.children, id)
        });
      } else {
        result.push(item);
      }
    }
  }
  return result;
}

// Helper: Add child to item recursively
function addChildToItem(item: DockMenuItem, parentId: string, child: DockMenuItem): DockMenuItem {
  if (item.id === parentId) {
    return {
      ...item,
      children: [...(item.children || []), child]
    };
  }
  if (item.children) {
    return {
      ...item,
      children: item.children.map(childItem => addChildToItem(childItem, parentId, child))
    };
  }
  return item;
}

export const DockConfigEditor: React.FC<DockConfigEditorProps> = ({
  userId = 'default-user',
  appId = 'stern-platform'
}) => {
  const { toast } = useToast();
  const openFinDock = useOpenFinDock();

  // React Query hooks
  const { data: loadedConfig, isLoading, error: loadError } = useDockConfig(userId);
  const saveMutation = useSaveDockConfig();

  // UI state
  const [currentConfig, setCurrentConfig] = useState<DockConfiguration | null>(null);
  const [selectedNode, setSelectedNode] = useState<DockMenuItem | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Sync OpenFin platform theme with React theme provider
  useOpenfinTheme();

  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerCallback, setIconPickerCallback] = useState<((icon: string) => void) | null>(null);

  // Sync loaded config to local state
  useEffect(() => {
    if (loadedConfig) {
      setCurrentConfig(loadedConfig);
      setIsDirty(false);
    } else if (!isLoading && !loadedConfig) {
      // No config found, create new one
      const newConfig = createDockConfiguration(userId, appId) as DockConfiguration;
      setCurrentConfig(newConfig);
      setIsDirty(true);
    }
  }, [loadedConfig, isLoading, userId, appId]);

  // Auto-save draft every 30 seconds
  const handleSaveDraft = useCallback(() => {
    if (currentConfig) {
      localStorage.setItem('dock-config-draft', JSON.stringify(currentConfig));
      toast({
        title: 'Draft saved',
        description: 'Your changes have been saved locally',
      });
    }
  }, [currentConfig, toast]);

  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(() => {
      handleSaveDraft();
    }, 30000);

    return () => clearTimeout(timer);
  }, [isDirty, handleSaveDraft]);

  const handleSave = useCallback(async () => {
    logger.debug('Save button clicked', undefined, 'DockConfigEditor');

    if (!currentConfig) {
      logger.error('No current config available', undefined, 'DockConfigEditor');
      toast({
        title: 'Error',
        description: 'No configuration loaded',
        variant: 'destructive'
      });
      return;
    }

    // Validate configuration before saving
    const validation = validateDockConfiguration(currentConfig);
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

    const menuItemCount = currentConfig.config?.menuItems?.length || 0;
    const configName = currentConfig.name;

    try {
      logger.info('Saving configuration...', undefined, 'DockConfigEditor');

      await saveMutation.mutateAsync({ userId, config: currentConfig });

      logger.info('Save completed successfully', undefined, 'DockConfigEditor');
      setIsDirty(false);

      // Reload the dock to show the updated configuration
      if (window.fin) {
        try {
          logger.info('Updating dock with new configuration...', undefined, 'DockConfigEditor');
          const dock = await import('@/openfin/platform/openfinDock');

          // Use updateConfig for efficient update (no deregister/register cycle)
          await dock.updateConfig({
            menuItems: currentConfig.config.menuItems
          });
          logger.info('Dock updated successfully', undefined, 'DockConfigEditor');
        } catch (dockError) {
          logger.error('Failed to update dock', dockError, 'DockConfigEditor');
          // If update fails, try full reload as fallback
          try {
            logger.info('Attempting full dock reload as fallback...', undefined, 'DockConfigEditor');
            const dock = await import('@/openfin/platform/openfinDock');
            await dock.reload();
            logger.info('Dock reloaded successfully', undefined, 'DockConfigEditor');
          } catch (reloadError) {
            logger.error('Failed to reload dock', reloadError, 'DockConfigEditor');
          }
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
  }, [currentConfig, saveMutation, userId, toast]);

  const handleAddMenuItem = useCallback(() => {
    if (!currentConfig) return;

    const newItem = createMenuItem();
    let newMenuItems = [...(currentConfig.config.menuItems || [])];

    if (selectedNode) {
      // Add as child
      newMenuItems = newMenuItems.map(menuItem =>
        addChildToItem(menuItem, selectedNode.id, newItem)
      );
    } else {
      // Add to root
      newMenuItems.push(newItem);
    }

    setCurrentConfig({
      ...currentConfig,
      config: {
        ...currentConfig.config,
        menuItems: newMenuItems
      }
    });
    setIsDirty(true);
  }, [currentConfig, selectedNode]);

  const handleDeleteMenuItem = useCallback(() => {
    if (!currentConfig || !selectedNode) return;

    const newMenuItems = deleteMenuItemRecursive(currentConfig.config.menuItems || [], selectedNode.id);

    setCurrentConfig({
      ...currentConfig,
      config: {
        ...currentConfig.config,
        menuItems: newMenuItems
      }
    });
    setSelectedNode(null);
    setIsDirty(true);

    toast({
      title: 'Item deleted',
      description: 'Menu item has been removed',
    });
  }, [currentConfig, selectedNode, toast]);

  const handleDuplicateMenuItem = useCallback(() => {
    if (!currentConfig || !selectedNode) return;

    const duplicate = createMenuItem({
      ...selectedNode,
      id: undefined,
      caption: `${selectedNode.caption} (Copy)`
    });

    const newMenuItems = [...(currentConfig.config.menuItems || []), duplicate];

    setCurrentConfig({
      ...currentConfig,
      config: {
        ...currentConfig.config,
        menuItems: newMenuItems
      }
    });
    setIsDirty(true);

    toast({
      title: 'Item duplicated',
      description: 'Menu item has been duplicated',
    });
  }, [currentConfig, selectedNode, toast]);

  const handlePreview = useCallback(async () => {
    if (!currentConfig) return;

    try {
      // Update dock with current configuration
      await openFinDock.updateDock(currentConfig.config);
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
  }, [currentConfig, openFinDock, toast]);

  const handleExport = useCallback(() => {
    if (!currentConfig) return;

    const dataStr = JSON.stringify(currentConfig, null, 2);
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
  }, [currentConfig, toast]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        setCurrentConfig(config);
        setIsDirty(true);
        setSelectedNode(null);
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
  }, [toast]);

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

  const handleUpdateMenuItem = useCallback((id: string, updates: Partial<DockMenuItem>) => {
    if (!currentConfig) return;

    const newMenuItems = updateMenuItemRecursive(currentConfig.config.menuItems || [], id, updates);

    // Update selected node if it's the one being updated
    if (selectedNode?.id === id) {
      setSelectedNode({ ...selectedNode, ...updates });
    }

    setCurrentConfig({
      ...currentConfig,
      config: {
        ...currentConfig.config,
        menuItems: newMenuItems
      }
    });
    setIsDirty(true);
  }, [currentConfig, selectedNode]);

  const handleReorderItems = useCallback((sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    if (!currentConfig) return;

    let newMenuItems = [...(currentConfig.config.menuItems || [])];

    // Find and remove source item
    const sourceItem = findMenuItem(newMenuItems, sourceId);
    if (!sourceItem) return;

    newMenuItems = deleteMenuItemRecursive(newMenuItems, sourceId);

    // Insert at new position (simplified - just add to root for now)
    if (position === 'inside') {
      newMenuItems = newMenuItems.map(item => addChildToItem(item, targetId, sourceItem));
    } else {
      const targetIndex = newMenuItems.findIndex(item => item.id === targetId);
      if (targetIndex !== -1) {
        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
        newMenuItems.splice(insertIndex, 0, sourceItem);
      }
    }

    setCurrentConfig({
      ...currentConfig,
      config: {
        ...currentConfig.config,
        menuItems: newMenuItems
      }
    });
    setIsDirty(true);
  }, [currentConfig]);

  const handleCreateNewConfig = useCallback(() => {
    const newConfig = createDockConfiguration(userId, appId) as DockConfiguration;
    setCurrentConfig(newConfig);
    setIsDirty(true);
    setSelectedNode(null);
  }, [userId, appId]);

  const error = loadError instanceof Error ? loadError.message : loadError ? String(loadError) : null;

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
            {isDirty && (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Unsaved changes
              </Badge>
            )}
            {isLoading && (
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
              disabled={!selectedNode}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicateMenuItem}
              disabled={!selectedNode}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
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
              disabled={!isDirty || isLoading || saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!currentConfig ? (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>No Configuration</CardTitle>
                <CardDescription>
                  Create a new dock configuration to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCreateNewConfig}>
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
                      items={currentConfig.config.menuItems}
                      selectedId={selectedNode?.id}
                      onSelect={setSelectedNode}
                      onReorder={handleReorderItems}
                      onUpdate={handleUpdateMenuItem}
                    />
                  </CardContent>
                </Card>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={60} minSize={40}>
              <div className="h-full p-4 overflow-auto">
                {selectedNode ? (
                  <PropertiesPanel
                    item={selectedNode}
                    onUpdate={(updates) => handleUpdateMenuItem(selectedNode.id, updates)}
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