/**
 * Properties Panel Component
 * Displays and edits properties of selected menu items
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buildUrl } from '@/openfin/utils';
import { RefreshCw, Image } from 'lucide-react';

import { DockMenuItem, DEFAULT_WINDOW_OPTIONS, DEFAULT_VIEW_OPTIONS } from '@/openfin/types/dockConfig';

interface PropertiesPanelProps {
  item: DockMenuItem;
  onUpdate: (updates: Partial<DockMenuItem>) => void;
  onIconSelect: (callback: (icon: string) => void) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  item,
  onUpdate,
  onIconSelect
}) => {
  const generateId = () => {
    const id = `menu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    onUpdate({ id });
  };

  const handleWindowOptionChange = (key: string, value: any) => {
    onUpdate({
      windowOptions: {
        ...item.windowOptions,
        [key]: value
      }
    });
  };

  const handleViewOptionChange = (key: string, value: any) => {
    onUpdate({
      viewOptions: {
        ...item.viewOptions,
        [key]: value
      }
    });
  };

  const fullUrl = item.url ? buildUrl(item.url) : '';

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Item Properties</CardTitle>
        <CardDescription>
          Configure the selected menu item
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="window" disabled={item.openMode !== 'window'}>
              Window
            </TabsTrigger>
            <TabsTrigger value="view" disabled={item.openMode !== 'view'}>
              View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption">Caption *</Label>
              <Input
                id="caption"
                value={item.caption}
                onChange={(e) => onUpdate({ caption: e.target.value })}
                placeholder="Menu item text"
                required
              />
            </div>

            {/* ID */}
            <div className="space-y-2">
              <Label htmlFor="id">Unique ID *</Label>
              <div className="flex gap-2">
                <Input
                  id="id"
                  value={item.id}
                  onChange={(e) => onUpdate({ id: e.target.value })}
                  placeholder="Unique identifier"
                  required
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={generateId}
                  title="Generate ID"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="url">Component URL</Label>
              <Input
                id="url"
                value={item.url}
                onChange={(e) => onUpdate({ url: e.target.value })}
                placeholder="/data-grid, /watchlist, etc."
                disabled={item.children && item.children.length > 0}
              />
              {fullUrl && (
                <p className="text-xs text-muted-foreground">
                  Full URL: {fullUrl}?id={item.id}
                </p>
              )}
            </div>

            {/* Open Mode */}
            <div className="space-y-2">
              <Label htmlFor="openMode">Open Mode</Label>
              <Select
                value={item.openMode}
                onValueChange={(value: 'window' | 'view') => onUpdate({ openMode: value })}
                disabled={item.children && item.children.length > 0}
              >
                <SelectTrigger id="openMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="window">New Window</SelectItem>
                  <SelectItem value="view">New View (Tab)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <div className="flex gap-2">
                <Input
                  id="icon"
                  value={item.icon || ''}
                  onChange={(e) => onUpdate({ icon: e.target.value })}
                  placeholder="/icons/app.svg"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onIconSelect((icon) => onUpdate({ icon }))}
                  title="Select Icon"
                >
                  <Image className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label htmlFor="order">Sort Order</Label>
              <Input
                id="order"
                type="number"
                value={item.order}
                onChange={(e) => onUpdate({ order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
          </TabsContent>

          <TabsContent value="window" className="space-y-4">
            <div className="space-y-4">
              {/* Window Dimensions */}
              <div>
                <h4 className="text-sm font-medium mb-3">Dimensions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="width">Width</Label>
                    <Input
                      id="width"
                      type="number"
                      value={item.windowOptions?.width || DEFAULT_WINDOW_OPTIONS.width}
                      onChange={(e) => handleWindowOptionChange('width', parseInt(e.target.value))}
                      min="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      type="number"
                      value={item.windowOptions?.height || DEFAULT_WINDOW_OPTIONS.height}
                      onChange={(e) => handleWindowOptionChange('height', parseInt(e.target.value))}
                      min="100"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Window Constraints */}
              <div>
                <h4 className="text-sm font-medium mb-3">Size Constraints</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="minWidth">Min Width</Label>
                    <Input
                      id="minWidth"
                      type="number"
                      value={item.windowOptions?.minWidth || DEFAULT_WINDOW_OPTIONS.minWidth}
                      onChange={(e) => handleWindowOptionChange('minWidth', parseInt(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minHeight">Min Height</Label>
                    <Input
                      id="minHeight"
                      type="number"
                      value={item.windowOptions?.minHeight || DEFAULT_WINDOW_OPTIONS.minHeight}
                      onChange={(e) => handleWindowOptionChange('minHeight', parseInt(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Window Options */}
              <div>
                <h4 className="text-sm font-medium mb-3">Window Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="resizable">Resizable</Label>
                    <Switch
                      id="resizable"
                      checked={item.windowOptions?.resizable ?? DEFAULT_WINDOW_OPTIONS.resizable}
                      onCheckedChange={(checked) => handleWindowOptionChange('resizable', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maximizable">Maximizable</Label>
                    <Switch
                      id="maximizable"
                      checked={item.windowOptions?.maximizable ?? DEFAULT_WINDOW_OPTIONS.maximizable}
                      onCheckedChange={(checked) => handleWindowOptionChange('maximizable', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="minimizable">Minimizable</Label>
                    <Switch
                      id="minimizable"
                      checked={item.windowOptions?.minimizable ?? DEFAULT_WINDOW_OPTIONS.minimizable}
                      onCheckedChange={(checked) => handleWindowOptionChange('minimizable', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="center">Center on Screen</Label>
                    <Switch
                      id="center"
                      checked={item.windowOptions?.center ?? DEFAULT_WINDOW_OPTIONS.center}
                      onCheckedChange={(checked) => handleWindowOptionChange('center', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="frame">Show Frame</Label>
                    <Switch
                      id="frame"
                      checked={item.windowOptions?.frame ?? DEFAULT_WINDOW_OPTIONS.frame}
                      onCheckedChange={(checked) => handleWindowOptionChange('frame', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alwaysOnTop">Always on Top</Label>
                    <Switch
                      id="alwaysOnTop"
                      checked={item.windowOptions?.alwaysOnTop ?? false}
                      onCheckedChange={(checked) => handleWindowOptionChange('alwaysOnTop', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="view" className="space-y-4">
            <div className="space-y-4">
              {/* View Bounds */}
              <div>
                <h4 className="text-sm font-medium mb-3">View Bounds</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="viewWidth">Width</Label>
                    <Input
                      id="viewWidth"
                      type="number"
                      value={item.viewOptions?.bounds?.width || DEFAULT_VIEW_OPTIONS.bounds.width}
                      onChange={(e) => handleViewOptionChange('bounds', {
                        ...item.viewOptions?.bounds,
                        width: parseInt(e.target.value)
                      })}
                      min="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="viewHeight">Height</Label>
                    <Input
                      id="viewHeight"
                      type="number"
                      value={item.viewOptions?.bounds?.height || DEFAULT_VIEW_OPTIONS.bounds.height}
                      onChange={(e) => handleViewOptionChange('bounds', {
                        ...item.viewOptions?.bounds,
                        height: parseInt(e.target.value)
                      })}
                      min="100"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Custom Data */}
              <div>
                <h4 className="text-sm font-medium mb-3">Custom Data (JSON)</h4>
                <textarea
                  className="w-full h-32 p-2 text-sm border rounded-md font-mono"
                  value={JSON.stringify(item.viewOptions?.customData || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const customData = JSON.parse(e.target.value);
                      handleViewOptionChange('customData', customData);
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder="{}"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};