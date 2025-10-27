/**
 * View Manager Service
 *
 * Centralized service for creating and managing OpenFin views with persistent instance IDs.
 * Tracks view instances in the Configuration Service for persistence across workspace restores.
 *
 * Based on AGV3 production pattern where view instances are registered and tracked.
 */

import { apiClient } from '@/utils/api/apiClient';
import { logger } from '@/utils/logger';
import { generateViewId, buildViewUrl, buildViewName } from '@/openfin/utils/viewUtils';
import { getAppId, getUserId } from '@/openfin/utils/platformContext';
import { UnifiedConfig } from './api/configurationService';

/**
 * View instance metadata
 */
export interface ViewInstance {
  id: string;                 // View instance ID (UUID)
  name: string;               // OpenFin view name
  type: string;               // Component type (e.g., 'demo-component', 'blotter')
  title?: string;             // Display title
  url: string;                // Full URL of the view
  createdAt: string;          // ISO timestamp
  customData?: Record<string, any>; // Additional custom data
}

/**
 * Options for creating a view
 */
export interface CreateViewOptions {
  type: string;               // Component type (e.g., 'demo-component')
  basePath: string;           // Component path (e.g., '/customcomponents')
  title?: string;             // Display title
  viewId?: string;            // Optional specific ID (generates new if not provided)
  customData?: Record<string, any>; // Additional custom data to pass to view
  windowOptions?: any;        // Additional OpenFin window options
}

class ViewManager {
  private readonly STORAGE_KEY = 'stern-view-instances';
  private readonly COMPONENT_TYPE = 'View';
  private readonly CONFIG_NAME = 'View Instances Registry';

  // In-memory cache of view instances
  private viewInstances = new Map<string, ViewInstance>();

  /**
   * Initialize view manager and load existing view instances from storage
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing ViewManager...', undefined, 'ViewManager');
      await this.loadViewInstances();
      logger.info('ViewManager initialized', { count: this.viewInstances.size }, 'ViewManager');
    } catch (error) {
      logger.error('Failed to initialize ViewManager', error, 'ViewManager');
      // Continue anyway - we can still create new views
    }
  }

  /**
   * Create a new view with persistent instance ID
   *
   * This method:
   * 1. Generates or uses provided view instance ID
   * 2. Builds URL with ID as query parameter
   * 3. Creates OpenFin view with customData containing ID
   * 4. Registers view instance in storage
   * 5. Returns view and instance metadata
   */
  async createView(options: CreateViewOptions): Promise<{ view: any; instance: ViewInstance }> {
    const viewId = options.viewId || generateViewId();
    const viewName = buildViewName(options.type, viewId);
    const userId = await getUserId();
    const appId = await getAppId();

    logger.info('Creating view with persistent ID', {
      viewId,
      type: options.type,
      basePath: options.basePath
    }, 'ViewManager');

    try {
      // Check if running in OpenFin
      if (typeof window === 'undefined' || !window.fin) {
        logger.warn('Not in OpenFin environment, cannot create view', undefined, 'ViewManager');
        throw new Error('Cannot create view outside OpenFin environment');
      }

      // Build URL with viewInstanceId parameter
      const url = buildViewUrl(options.basePath, viewId);

      // Prepare customData
      const customData = {
        viewInstanceId: viewId,
        componentType: options.type,
        appId,
        userId,
        ...options.customData
      };

      // Create the view using OpenFin Platform API
      const { getCurrentSync } = await import('@openfin/workspace-platform');
      const platform = getCurrentSync();

      const view = await platform.createView({
        url,
        name: viewName,
        title: options.title || options.type,
        customData,
        ...options.windowOptions
      });

      logger.info('View created successfully', { viewId, viewName }, 'ViewManager');

      // Create view instance metadata
      const instance: ViewInstance = {
        id: viewId,
        name: viewName,
        type: options.type,
        title: options.title,
        url,
        createdAt: new Date().toISOString(),
        customData
      };

      // Register the view instance
      await this.saveViewInstance(instance);

      return { view, instance };
    } catch (error) {
      logger.error('Failed to create view', error, 'ViewManager');
      throw error;
    }
  }

  /**
   * Get all registered view instances
   */
  async getViewInstances(): Promise<ViewInstance[]> {
    await this.loadViewInstances();
    return Array.from(this.viewInstances.values());
  }

  /**
   * Get a specific view instance by ID
   */
  async getViewInstance(viewId: string): Promise<ViewInstance | null> {
    await this.loadViewInstances();
    return this.viewInstances.get(viewId) || null;
  }

  /**
   * Delete a view instance from registry
   */
  async deleteViewInstance(viewId: string): Promise<void> {
    logger.info('Deleting view instance', { viewId }, 'ViewManager');

    this.viewInstances.delete(viewId);
    await this.saveViewInstancesToConfig();

    logger.info('View instance deleted', { viewId }, 'ViewManager');
  }

  /**
   * Save a single view instance
   */
  private async saveViewInstance(instance: ViewInstance): Promise<void> {
    this.viewInstances.set(instance.id, instance);
    await this.saveViewInstancesToConfig();
    logger.debug('View instance saved', { id: instance.id }, 'ViewManager');
  }

  /**
   * Load view instances from Configuration Service
   */
  private async loadViewInstances(): Promise<void> {
    try {
      const userId = await getUserId();
      const appId = await getAppId();

      logger.debug('Loading view instances from Configuration Service', { userId, appId }, 'ViewManager');

      // Query for view instances configuration
      const response = await apiClient.get('/configurations', {
        params: {
          componentType: this.COMPONENT_TYPE,
          componentSubType: this.STORAGE_KEY,
          userId,
          appId
        }
      });

      if (response.data && response.data.length > 0) {
        // Use the first matching config (there should only be one)
        const config = response.data[0];

        if (config.config && config.config.instances) {
          // Load instances into map
          this.viewInstances.clear();
          Object.entries(config.config.instances).forEach(([id, instance]) => {
            this.viewInstances.set(id, instance as ViewInstance);
          });

          logger.info('View instances loaded from storage', {
            count: this.viewInstances.size,
            configId: config.configId
          }, 'ViewManager');
        }
      } else {
        logger.info('No existing view instances found in storage', undefined, 'ViewManager');
      }
    } catch (error) {
      // If 404, that's okay - no saved instances yet
      if ((error as any).response?.status === 404) {
        logger.info('No view instances configuration exists yet', undefined, 'ViewManager');
      } else {
        logger.error('Failed to load view instances', error, 'ViewManager');
      }
    }
  }

  /**
   * Save all view instances to Configuration Service
   */
  private async saveViewInstancesToConfig(): Promise<void> {
    try {
      const userId = await getUserId();
      const appId = await getAppId();

      // Convert map to object for storage
      const instances: Record<string, ViewInstance> = {};
      this.viewInstances.forEach((instance, id) => {
        instances[id] = instance;
      });

      logger.debug('Saving view instances to Configuration Service', {
        count: this.viewInstances.size,
        userId,
        appId
      }, 'ViewManager');

      // First, try to find existing config
      const response = await apiClient.get('/configurations', {
        params: {
          componentType: this.COMPONENT_TYPE,
          componentSubType: this.STORAGE_KEY,
          userId,
          appId
        }
      });

      if (response.data && response.data.length > 0) {
        // Update existing config
        const existingConfig = response.data[0];
        await apiClient.put(`/configurations/${existingConfig.configId}`, {
          config: { instances }
        });

        logger.info('View instances updated in storage', {
          configId: existingConfig.configId,
          count: this.viewInstances.size
        }, 'ViewManager');
      } else {
        // Create new config
        const defaultVersionId = crypto.randomUUID();
        const now = new Date();

        const configData = {
          appId,
          userId,
          name: this.CONFIG_NAME,
          description: 'Registry of all view instances for workspace persistence',
          componentType: this.COMPONENT_TYPE,
          componentSubType: this.STORAGE_KEY,
          config: { instances },
          settings: [
            {
              versionId: defaultVersionId,
              name: 'Default',
              description: 'Initial view instances registry',
              config: { instances },
              createdTime: now,
              updatedTime: now,
              isActive: true,
              metadata: {}
            }
          ],
          activeSetting: defaultVersionId,
          createdBy: userId,
          lastUpdatedBy: userId
        };

        const result = await apiClient.post('/configurations', configData);

        logger.info('View instances registry created in storage', {
          configId: result.data.configId,
          count: this.viewInstances.size
        }, 'ViewManager');
      }
    } catch (error) {
      logger.error('Failed to save view instances to storage', error, 'ViewManager');
      throw error;
    }
  }
}

// Export singleton instance
export const viewManager = new ViewManager();
