/**
 * Window Cloner Component
 *
 * Allows users to clone the current window with a separate config.
 * Each clone is fully independent and can be customized separately.
 */

import React from 'react';
import { useOpenFinComponent } from '@/components/openfin/OpenFinComponent';
import { useOpenFinWorkspace } from '@/services/openfin/OpenFinWorkspaceProvider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Copy } from 'lucide-react';
import { logger } from '@/utils/logger';
import { apiClient } from '@/utils/apiClient';

export function WindowCloner() {
  const { identity, config } = useOpenFinComponent();
  const workspace = useOpenFinWorkspace();
  const { toast } = useToast();

  const handleClone = async () => {
    if (!config) {
      toast({
        title: 'Cannot clone',
        description: 'No configuration loaded',
        variant: 'destructive'
      });
      return;
    }

    try {
      logger.info('Cloning window', { configId: identity.configId }, 'WindowCloner');

      // Create new config on server (clone of current)
      const response = await apiClient.post('/api/v1/configurations', {
        name: `${config.name} (Clone)`,
        componentType: config.componentType,
        componentSubType: config.componentSubType,
        config: config.config,        // Clone current config
        settings: config.settings,    // Clone layouts
        createdBy: identity.uuid,
        userId: config.userId
      });

      const newConfig = response.data;

      logger.info('Cloned config created', {
        originalConfigId: identity.configId,
        newConfigId: newConfig.configId
      }, 'WindowCloner');

      // Get base URL without query params
      const baseUrl = window.location.href.split('?')[0];
      const newUrl = `${baseUrl}?configId=${newConfig.configId}`;

      // Open new window with new configId
      await workspace.createView({
        name: `${identity.windowName}-clone-${Date.now()}`,
        url: newUrl,
        customData: {
          configId: newConfig.configId,
          componentType: newConfig.componentType,
          componentSubType: newConfig.componentSubType
        }
      });

      logger.info('Clone window created', {
        windowName: `${identity.windowName}-clone-${Date.now()}`,
        configId: newConfig.configId
      }, 'WindowCloner');

      toast({
        title: 'Window cloned',
        description: `Created "${newConfig.name}"`
      });
    } catch (error) {
      logger.error('Failed to clone window', error, 'WindowCloner');

      toast({
        title: 'Clone failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClone}
      className="gap-2"
    >
      <Copy className="h-4 w-4" />
      Clone Window
    </Button>
  );
}
