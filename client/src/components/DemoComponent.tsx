/**
 * DemoComponent
 *
 * Demonstrates all features of the SternPlatformProvider:
 * 1. Accessing AppData variables
 * 2. Subscribing to OpenFin IAB events
 * 3. Saving/loading configuration via configServices
 * 4. Displaying API base URL and environment info
 * 5. Broadcasting custom events
 */

import React, { useState, useEffect } from 'react';
import { useSternPlatform } from '@/providers/SternPlatformProvider';
import { OpenFinCustomEvents } from '@/openfin/types/openfinEvents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import { UnifiedConfig } from '@stern/shared-types';
import { getAppId, getUserId } from '@/openfin/utils/platformContext';
import { getViewInstanceId } from '@/openfin/utils/viewUtils';

interface DemoConfig {
  message: string;
  counter: number;
  enabled: boolean;
}

export const DemoComponent: React.FC = () => {
  const platform = useSternPlatform();
  const { toast } = useToast();

  // View instance ID (persistent across workspace saves/restores)
  const [viewInstanceId] = useState<string>(() => getViewInstanceId());

  // Component configuration state (no more configId needed!)
  const [config, setConfig] = useState<DemoConfig>({
    message: 'Hello from DemoComponent!',
    counter: 0,
    enabled: true,
  });

  // Event log
  const [eventLog, setEventLog] = useState<Array<{ time: string; event: string; data: any }>>([]);

  // Loading state
  const [isSaving, setIsSaving] = useState(false);

  // Load existing configuration on mount if it exists
  useEffect(() => {
    const loadExistingConfig = async () => {
      try {
        const userId = await getUserId();
        const configKey = `demo-component-${viewInstanceId}`;

        logger.info('Attempting to load existing config', {
          viewInstanceId,
          configKey,
          userId
        }, 'DemoComponent');

        // Direct lookup using composite key - single query!
        const existingConfig = await platform.configService.findByCompositeKey(
          userId,
          'CustomComponent',
          configKey,
          'demo'
        );

        if (existingConfig) {
          logger.info('Found existing config for this view instance', {
            configId: existingConfig.configId,
            viewInstanceId
          }, 'DemoComponent');

          if (existingConfig.config) {
            setConfig(existingConfig.config as DemoConfig);
          }

          toast({
            title: 'Configuration Loaded',
            description: `Loaded saved configuration for this view instance`,
          });
        } else {
          logger.info('No existing config found for this view instance', { viewInstanceId }, 'DemoComponent');
        }
      } catch (error) {
        logger.warn('Failed to load existing config', error, 'DemoComponent');
        // Continue with default config
      }
    };

    loadExistingConfig();
  }, [viewInstanceId, platform.configService, toast]);

  // Subscribe to OpenFin events on mount
  useEffect(() => {
    if (!platform.isOpenFin) return;

    logger.info('DemoComponent subscribing to OpenFin events...', undefined, 'DemoComponent');

    // Subscribe to theme changes
    const unsubTheme = platform.subscribeToEvent(
      OpenFinCustomEvents.THEME_CHANGE,
      (data) => {
        logger.info('Theme change event received', data, 'DemoComponent');
        addEventLog('THEME_CHANGE', data);
        toast({
          title: 'Theme Changed',
          description: `New theme: ${data.theme}`,
        });
      }
    );

    // Subscribe to config updates
    const unsubConfig = platform.subscribeToEvent(
      OpenFinCustomEvents.CONFIG_UPDATED,
      (data) => {
        logger.info('Config update event received', data, 'DemoComponent');
        addEventLog('CONFIG_UPDATED', data);
        toast({
          title: 'Config Updated',
          description: `Config ID: ${data.configId}`,
        });
      }
    );

    // Subscribe to AppData updates
    const unsubAppData = platform.subscribeToEvent(
      OpenFinCustomEvents.APPDATA_UPDATED,
      (data) => {
        logger.info('AppData update event received', data, 'DemoComponent');
        addEventLog('APPDATA_UPDATED', data);
        toast({
          title: 'AppData Updated',
          description: `Provider: ${data.providerName}`,
        });
      }
    );

    // Subscribe to data refresh
    const unsubRefresh = platform.subscribeToEvent(
      OpenFinCustomEvents.DATA_REFRESH,
      (data) => {
        logger.info('Data refresh event received', data, 'DemoComponent');
        addEventLog('DATA_REFRESH', data);
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      unsubTheme();
      unsubConfig();
      unsubAppData();
      unsubRefresh();
      logger.info('DemoComponent unsubscribed from OpenFin events', undefined, 'DemoComponent');
    };
  }, [platform]);

  const addEventLog = (event: string, data: any) => {
    const time = new Date().toLocaleTimeString();
    setEventLog(prev => [{ time, event, data }, ...prev].slice(0, 10)); // Keep last 10 events
  };

  // Save configuration to config services
  const handleSaveConfig = async () => {
    setIsSaving(true);

    try {
      const appId = await getAppId();
      const userId = await getUserId();
      const configKey = `demo-component-${viewInstanceId}`;

      logger.info('Saving DemoComponent config', { viewInstanceId, configKey }, 'DemoComponent');

      // Upsert handles both create and update automatically!
      const savedConfig = await platform.configService.upsert(
        userId,
        'CustomComponent',
        configKey,
        config,
        'demo',
        appId
      );

      logger.info('Config saved successfully', { configId: savedConfig.configId }, 'DemoComponent');

      toast({
        title: 'Configuration Saved',
        description: `Config ID: ${savedConfig.configId}`,
      });

      // Broadcast config update event
      if (platform.isOpenFin) {
        await platform.broadcastEvent(OpenFinCustomEvents.CONFIG_UPDATED, {
          configId: savedConfig.configId,
          componentType: 'CustomComponent',
          componentSubType: 'demo',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      logger.error('Failed to save config', error, 'DemoComponent');
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Note: Configuration is automatically loaded on mount via useEffect
  // No need for manual reload since upsert pattern handles everything

  // Broadcast a custom data refresh event
  const handleBroadcastRefresh = async () => {
    if (!platform.isOpenFin) {
      toast({
        title: 'Not in OpenFin',
        description: 'Event broadcasting only works in OpenFin environment',
        variant: 'destructive',
      });
      return;
    }

    try {
      await platform.broadcastEvent(OpenFinCustomEvents.DATA_REFRESH, {
        source: 'DemoComponent',
        timestamp: Date.now(),
      });

      toast({
        title: 'Event Broadcasted',
        description: 'DATA_REFRESH event sent to all windows',
      });

      logger.info('Broadcasted DATA_REFRESH event', undefined, 'DemoComponent');
    } catch (error) {
      logger.error('Failed to broadcast event', error, 'DemoComponent');
      toast({
        title: 'Broadcast Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DemoComponent</h1>
          <p className="text-muted-foreground mt-2">
            Demonstrates all features of the SternPlatformProvider
          </p>
        </div>

        {/* Platform Info */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Information</CardTitle>
            <CardDescription>Environment and configuration details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Environment</Label>
                <div className="mt-1">
                  <Badge variant={platform.isOpenFin ? 'default' : 'secondary'}>
                    {platform.environment}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">API Base URL</Label>
                <div className="mt-1 font-mono text-sm">{platform.apiBaseUrl}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">View Instance ID</Label>
                <div className="mt-1 font-mono text-xs break-all">{viewInstanceId}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Platform Ready</Label>
                <div className="mt-1">
                  <Badge variant={platform.isReady ? 'default' : 'secondary'}>
                    {platform.isReady ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">AppData Ready</Label>
                <div className="mt-1">
                  <Badge variant={platform.appData.isReady ? 'default' : 'secondary'}>
                    {platform.appData.isReady ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AppData Variables */}
        <Card>
          <CardHeader>
            <CardTitle>AppData Variables</CardTitle>
            <CardDescription>
              Global application variables accessible across all windows
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(platform.appData.variables).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No AppData variables configured</p>
                <p className="text-sm mt-2">
                  Create an AppData provider in the Data Providers section
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(platform.appData.variables).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm font-medium truncate">{key}</div>
                      <div className="font-mono text-xs text-muted-foreground mt-1 break-all">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Management */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Management</CardTitle>
            <CardDescription>
              Save and load component configuration via config services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                value={config.message}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                placeholder="Enter a message"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="counter">Counter</Label>
              <Input
                id="counter"
                type="number"
                value={config.counter}
                onChange={(e) => setConfig({ ...config, counter: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="enabled">Enabled</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveConfig} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Config'}
              </Button>
              <Button onClick={handleBroadcastRefresh} variant="secondary">
                Broadcast Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* OpenFin Events */}
        <Card>
          <CardHeader>
            <CardTitle>OpenFin Events</CardTitle>
            <CardDescription>
              Real-time event log from IAB subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleBroadcastRefresh} variant="outline" size="sm">
              Broadcast DATA_REFRESH Event
            </Button>

            <Separator />

            {eventLog.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No events received yet</p>
                <p className="text-sm mt-2">
                  {platform.isOpenFin
                    ? 'Events will appear here when broadcasted'
                    : 'Event monitoring only works in OpenFin environment'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {eventLog.map((log, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{log.event}</Badge>
                      <span className="text-xs text-muted-foreground">{log.time}</span>
                    </div>
                    <Textarea
                      value={JSON.stringify(log.data, null, 2)}
                      readOnly
                      className="font-mono text-xs h-24"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoComponent;
