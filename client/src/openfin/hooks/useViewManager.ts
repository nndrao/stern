/**
 * useViewManager Hook
 *
 * React hook for creating and managing OpenFin views with persistent instance IDs.
 * Wraps the viewManager service in a React-friendly API.
 */

import { useCallback, useState, useEffect } from 'react';
import { viewManager, ViewInstance, CreateViewOptions } from '@/services/viewManager';
import { logger } from '@/utils/logger';

export interface UseViewManagerReturn {
  /** Create a new view with persistent ID */
  createView: (options: CreateViewOptions) => Promise<{ view: any; instance: ViewInstance }>;

  /** Get all registered view instances */
  getViews: () => Promise<ViewInstance[]>;

  /** Get a specific view instance by ID */
  getView: (viewId: string) => Promise<ViewInstance | null>;

  /** Delete a view instance from registry */
  deleteView: (viewId: string) => Promise<void>;

  /** Currently registered view instances */
  views: ViewInstance[];

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: Error | null;

  /** Refresh the view list */
  refreshViews: () => Promise<void>;
}

/**
 * Hook for managing OpenFin views with persistent instance IDs
 *
 * @example
 * ```tsx
 * const { createView, views, isLoading } = useViewManager();
 *
 * const handleCreateDemoView = async () => {
 *   const { view, instance } = await createView({
 *     type: 'demo-component',
 *     basePath: '/customcomponents',
 *     title: 'My Demo Component'
 *   });
 *   console.log('Created view:', instance.id);
 * };
 * ```
 */
export function useViewManager(): UseViewManagerReturn {
  const [views, setViews] = useState<ViewInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load view instances from storage
   */
  const loadViews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const instances = await viewManager.getViewInstances();
      setViews(instances);
      logger.debug('Loaded view instances', { count: instances.length }, 'useViewManager');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load views');
      setError(error);
      logger.error('Failed to load views', error, 'useViewManager');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new view
   */
  const createView = useCallback(async (options: CreateViewOptions) => {
    try {
      setIsLoading(true);
      setError(null);

      logger.info('Creating view via hook', { type: options.type }, 'useViewManager');

      const result = await viewManager.createView(options);

      // Refresh the view list
      await loadViews();

      logger.info('View created successfully', { viewId: result.instance.id }, 'useViewManager');
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create view');
      setError(error);
      logger.error('Failed to create view', error, 'useViewManager');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadViews]);

  /**
   * Get all view instances
   */
  const getViews = useCallback(async () => {
    try {
      return await viewManager.getViewInstances();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get views');
      setError(error);
      logger.error('Failed to get views', error, 'useViewManager');
      return [];
    }
  }, []);

  /**
   * Get a specific view instance
   */
  const getView = useCallback(async (viewId: string) => {
    try {
      return await viewManager.getViewInstance(viewId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get view');
      setError(error);
      logger.error('Failed to get view', error, 'useViewManager');
      return null;
    }
  }, []);

  /**
   * Delete a view instance
   */
  const deleteView = useCallback(async (viewId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      logger.info('Deleting view via hook', { viewId }, 'useViewManager');

      await viewManager.deleteViewInstance(viewId);

      // Refresh the view list
      await loadViews();

      logger.info('View deleted successfully', { viewId }, 'useViewManager');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete view');
      setError(error);
      logger.error('Failed to delete view', error, 'useViewManager');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadViews]);

  /**
   * Refresh the view list
   */
  const refreshViews = useCallback(async () => {
    await loadViews();
  }, [loadViews]);

  // Load views on mount
  useEffect(() => {
    loadViews();
  }, [loadViews]);

  return {
    createView,
    getViews,
    getView,
    deleteView,
    views,
    isLoading,
    error,
    refreshViews
  };
}
