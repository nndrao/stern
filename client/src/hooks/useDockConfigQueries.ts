/**
 * React Query hooks for Dock Configuration operations
 * Replaces Zustand dockConfigStore with simpler React Query + useState approach
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DockConfiguration } from '@/openfin/types/dockConfig';
import { dockConfigService } from '@/services/dockConfigService';
import { logger } from '@/utils/logger';
import { useToast } from '@/components/ui/use-toast';

/**
 * Query key factory for dock configuration
 */
export const dockConfigKeys = {
  all: ['dockConfig'] as const,
  lists: () => [...dockConfigKeys.all, 'list'] as const,
  list: (userId: string) => [...dockConfigKeys.lists(), userId] as const,
  details: () => [...dockConfigKeys.all, 'detail'] as const,
  detail: (id: string) => [...dockConfigKeys.details(), id] as const,
};

/**
 * Hook to fetch dock configuration for a user
 */
export function useDockConfig(userId: string) {
  return useQuery({
    queryKey: dockConfigKeys.list(userId),
    queryFn: async () => {
      logger.info('Fetching dock configuration', { userId }, 'useDockConfig');

      try {
        const config = await dockConfigService.loadApplicationsMenuItems(userId);
        logger.info('Dock configuration loaded', { configId: config?.configId }, 'useDockConfig');
        return config;
      } catch (error: unknown) {
        // If no config exists (404), return null instead of throwing
        if (error && typeof error === 'object') {
          const err = error as { status?: number; message?: string };
          if (err.status === 404 || err.message?.includes('not found')) {
            logger.info('No dock configuration found for user', { userId }, 'useDockConfig');
            return null;
          }
        }
        throw error;
      }
    },
    enabled: !!userId,
  });
}

/**
 * Hook to save dock configuration (create or update)
 */
export function useSaveDockConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ config, userId }: { config: DockConfiguration; userId: string }) => {
      logger.info('Saving dock configuration', { configId: config.configId }, 'useSaveDockConfig');

      let saved: DockConfiguration;

      if (config.configId) {
        // Update existing configuration using update method
        saved = await dockConfigService.update(config.configId, config);
        logger.info('Dock configuration updated', { configId: saved.configId }, 'useSaveDockConfig');
      } else {
        // Create new configuration
        saved = await dockConfigService.save(config);
        logger.info('Dock configuration created', { configId: saved.configId }, 'useSaveDockConfig');
      }

      return saved;
    },
    onSuccess: (data, variables) => {
      // Invalidate the dock config query
      queryClient.invalidateQueries({ queryKey: dockConfigKeys.list(variables.userId) });

      toast({
        title: 'Configuration Saved',
        description: 'Dock configuration saved successfully',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to save dock configuration', error, 'useSaveDockConfig');
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save dock configuration',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete dock configuration
 */
export function useDeleteDockConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ configId, userId }: { configId: string; userId: string }) => {
      logger.info('Deleting dock configuration', { configId }, 'useDeleteDockConfig');
      await dockConfigService.delete(configId);
      logger.info('Dock configuration deleted', { configId }, 'useDeleteDockConfig');
      return configId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dockConfigKeys.list(variables.userId) });
      toast({
        title: 'Configuration Deleted',
        description: 'Dock configuration deleted successfully',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to delete dock configuration', error, 'useDeleteDockConfig');
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete dock configuration',
        variant: 'destructive',
      });
    },
  });
}
