/**
 * React Query hooks for Data Provider operations
 * Replaces Zustand dataProviderStore with simpler React Query + useState approach
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataProviderConfig } from '@stern/shared-types';
import { dataProviderConfigService } from '@/services/api/dataProviderConfigService';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/ui/use-toast';

/**
 * Query key factory for data providers
 */
export const dataProviderKeys = {
  all: ['dataProviders'] as const,
  lists: () => [...dataProviderKeys.all, 'list'] as const,
  list: (userId: string) => [...dataProviderKeys.lists(), userId] as const,
  details: () => [...dataProviderKeys.all, 'detail'] as const,
  detail: (id: string) => [...dataProviderKeys.details(), id] as const,
};

/**
 * Hook to fetch all data providers for a user
 */
export function useDataProviders(userId: string) {
  return useQuery({
    queryKey: dataProviderKeys.list(userId),
    queryFn: async () => {
      logger.info('Fetching data providers', { userId }, 'useDataProviders');
      const providers = await dataProviderConfigService.getByUser(userId);
      logger.info('Data providers fetched', { count: providers.length }, 'useDataProviders');
      return providers;
    },
    enabled: !!userId,
  });
}

/**
 * Hook to fetch a single data provider by ID
 */
export function useDataProvider(providerId: string | null) {
  return useQuery({
    queryKey: dataProviderKeys.detail(providerId || ''),
    queryFn: async () => {
      if (!providerId) return null;
      logger.info('Fetching data provider', { providerId }, 'useDataProvider');
      const provider = await dataProviderConfigService.getById(providerId);
      logger.info('Data provider fetched', { providerId }, 'useDataProvider');
      return provider;
    },
    enabled: !!providerId,
  });
}

/**
 * Hook to create a new data provider
 */
export function useCreateDataProvider() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ provider, userId }: { provider: DataProviderConfig; userId: string }) => {
      logger.info('Creating data provider', { name: provider.name }, 'useCreateDataProvider');
      const created = await dataProviderConfigService.create(provider, userId);
      logger.info('Data provider created', { providerId: created.providerId }, 'useCreateDataProvider');
      return created;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch providers list
      queryClient.invalidateQueries({ queryKey: dataProviderKeys.list(variables.userId) });
      toast({
        title: 'Provider Created',
        description: 'Data provider created successfully',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to create data provider', error, 'useCreateDataProvider');
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create data provider',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update an existing data provider
 */
export function useUpdateDataProvider() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      providerId,
      updates,
      userId,
    }: {
      providerId: string;
      updates: Partial<DataProviderConfig>;
      userId: string;
    }) => {
      logger.info('Updating data provider', { providerId }, 'useUpdateDataProvider');
      const updated = await dataProviderConfigService.update(providerId, updates, userId);
      logger.info('Data provider updated', { providerId }, 'useUpdateDataProvider');
      return updated;
    },
    onSuccess: (data, variables) => {
      // Invalidate both the list and the specific provider detail
      queryClient.invalidateQueries({ queryKey: dataProviderKeys.list(variables.userId) });
      queryClient.invalidateQueries({ queryKey: dataProviderKeys.detail(variables.providerId) });
      toast({
        title: 'Provider Updated',
        description: 'Data provider updated successfully',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to update data provider', error, 'useUpdateDataProvider');
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update data provider',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete a data provider
 */
export function useDeleteDataProvider() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ providerId, userId }: { providerId: string; userId: string }) => {
      logger.info('Deleting data provider', { providerId }, 'useDeleteDataProvider');
      await dataProviderConfigService.delete(providerId);
      logger.info('Data provider deleted', { providerId }, 'useDeleteDataProvider');
      return providerId;
    },
    onSuccess: (_, variables) => {
      // Invalidate providers list
      queryClient.invalidateQueries({ queryKey: dataProviderKeys.list(variables.userId) });
      toast({
        title: 'Provider Deleted',
        description: 'Data provider deleted successfully',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to delete data provider', error, 'useDeleteDataProvider');
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete data provider',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to clone a data provider
 */
export function useCloneDataProvider() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      providerId,
      newName,
      userId,
    }: {
      providerId: string;
      newName: string;
      userId: string;
    }) => {
      logger.info('Cloning data provider', { providerId, newName }, 'useCloneDataProvider');

      // Fetch the source provider
      const sourceProvider = await dataProviderConfigService.getById(providerId);

      // Create new provider with modified name
      const clonedProvider: DataProviderConfig = {
        ...sourceProvider,
        name: newName,
        providerId: '', // Will be generated by server
        isDefault: false, // Clones are never default
      };

      const created = await dataProviderConfigService.create(clonedProvider, userId);
      logger.info('Data provider cloned', { newProviderId: created.providerId }, 'useCloneDataProvider');
      return created;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dataProviderKeys.list(variables.userId) });
      toast({
        title: 'Provider Cloned',
        description: 'Data provider cloned successfully',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to clone data provider', error, 'useCloneDataProvider');
      toast({
        title: 'Clone Failed',
        description: error.message || 'Failed to clone data provider',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to set a provider as default
 */
export function useSetDefaultProvider() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ providerId, userId }: { providerId: string; userId: string }) => {
      logger.info('Setting default provider', { providerId }, 'useSetDefaultProvider');

      // Update the provider to set isDefault = true
      const updated = await dataProviderConfigService.update(providerId, { isDefault: true }, userId);

      logger.info('Default provider set', { providerId }, 'useSetDefaultProvider');
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dataProviderKeys.list(variables.userId) });
      toast({
        title: 'Default Provider Set',
        description: 'Default data provider updated successfully',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to set default provider', error, 'useSetDefaultProvider');
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to set default provider',
        variant: 'destructive',
      });
    },
  });
}
