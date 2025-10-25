/**
 * Dock Configuration Service
 * API service for managing dock configurations
 */

import { apiClient, apiCall } from '@/utils/apiClient';
import { DockConfiguration, DockConfigFilter, DockMenuItem, DockApplicationsMenuItemsConfig } from '@/openfin/types/dockConfig';
import { COMPONENT_TYPES, COMPONENT_SUBTYPES } from '@stern/shared-types';
import { logger } from '@/utils/logger';

/**
 * Helper function to clean menu items - set defaults for missing fields
 */
function cleanMenuItems(items: DockMenuItem[]): DockMenuItem[] {
  return items.map(item => ({
    ...item,
    icon: item.icon || 'https://cdn.openfin.co/workspace/19.0.11/icons/defaultFavorite.svg',
    url: item.url || '/default',
    children: item.children ? cleanMenuItems(item.children) : []
  }));
}

/**
 * Dock Configuration API Service
 */
export const dockConfigService = {
  /**
   * Save a new dock configuration
   */
  async save(config: DockConfiguration): Promise<DockConfiguration> {
    // Clean the config before saving
    const cleanedConfig = {
      ...config,
      // Don't set a default icon - let it fall back to platform icon during registration
      icon: config.icon || undefined,
      description: config.description || '',
      componentType: COMPONENT_TYPES.DOCK,
      config: {
        ...config.config,
        menuItems: config.config?.menuItems ? cleanMenuItems(config.config.menuItems) : []
      }
    };

    return apiCall<DockConfiguration>(
      () => apiClient.post('/configurations', cleanedConfig),
      'Failed to save dock configuration'
    );
  },

  /**
   * Load the singleton DockApplicationsMenuItems configuration
   * This is the NEW way - dock menu items are stored separately from data providers
   */
  async loadApplicationsMenuItems(userId: string): Promise<DockApplicationsMenuItemsConfig | null> {
    try {
      const configs = await apiCall<DockApplicationsMenuItemsConfig[]>(
        () => apiClient.get('/configurations/by-user/' + userId, {
          params: {
            componentType: COMPONENT_TYPES.DOCK,
            componentSubType: COMPONENT_SUBTYPES.DOCK_APPLICATIONS_MENU_ITEMS,
            includeDeleted: false
          }
        }),
        'Failed to load dock applications menu items'
      );
      return configs.length > 0 ? configs[0] : null;
    } catch (error) {
      logger.error('Error loading dock applications menu items', error, 'DockConfigService');
      return null;
    }
  },

  /**
   * Load dock configurations for a user
   * @deprecated Use loadApplicationsMenuItems() instead for menu items
   */
  async loadByUser(userId: string): Promise<DockConfiguration[]> {
    return apiCall<DockConfiguration[]>(
      () => apiClient.get('/configurations/by-user/' + userId, {
        params: {
          componentType: COMPONENT_TYPES.DOCK,
          includeDeleted: false
        }
      }),
      'Failed to load dock configurations'
    );
  },

  /**
   * Load a specific dock configuration by ID
   */
  async loadById(configId: string): Promise<DockConfiguration> {
    return apiCall<DockConfiguration>(
      () => apiClient.get('/configurations/' + configId),
      'Failed to load dock configuration'
    );
  },

  /**
   * Update an existing dock configuration
   */
  async update(configId: string, updates: Partial<DockConfiguration>): Promise<DockConfiguration> {
    // Remove fields that shouldn't be sent in updates (server manages these)
    const { configId: _, creationTime, lastUpdated, createdBy, ...updateData } = updates;

    // Set defaults for optional fields that server validation might require
    const cleanedData = {
      ...updateData,
      // Don't set a default icon - let it fall back to platform icon during registration
      icon: updateData.icon || undefined,
      description: updateData.description || '',
      componentType: COMPONENT_TYPES.DOCK,
      lastUpdatedBy: updates.lastUpdatedBy || updates.userId || 'unknown'
    };

    // Clean up menu items - set default icon and url for items that don't have them
    if (cleanedData.config?.menuItems) {
      cleanedData.config = {
        ...cleanedData.config,
        menuItems: cleanMenuItems(cleanedData.config.menuItems)
      };
    }

    return apiCall<DockConfiguration>(
      () => apiClient.put('/configurations/' + configId, cleanedData),
      'Failed to update dock configuration'
    );
  },

  /**
   * Delete a dock configuration (soft delete)
   */
  async delete(configId: string): Promise<void> {
    return apiCall<void>(
      () => apiClient.delete('/configurations/' + configId),
      'Failed to delete dock configuration'
    );
  },

  /**
   * Query dock configurations with filters
   */
  async query(filter: DockConfigFilter): Promise<DockConfiguration[]> {
    return apiCall<DockConfiguration[]>(
      () => apiClient.get('/configurations', {
        params: {
          ...filter,
          componentType: COMPONENT_TYPES.DOCK
        }
      }),
      'Failed to query dock configurations'
    );
  },

  /**
   * Clone an existing dock configuration
   */
  async clone(configId: string, newName: string, userId: string): Promise<DockConfiguration> {
    return apiCall<DockConfiguration>(
      () => apiClient.post(`/configurations/${configId}/clone`, {
        newName,
        userId
      }),
      'Failed to clone dock configuration'
    );
  },

  /**
   * List all available dock configurations for an app
   */
  async listByApp(appId: string): Promise<DockConfiguration[]> {
    return apiCall<DockConfiguration[]>(
      () => apiClient.get('/configurations/by-app/' + appId, {
        params: {
          componentType: COMPONENT_TYPES.DOCK,
          includeDeleted: false
        }
      }),
      'Failed to list dock configurations'
    );
  },

  /**
   * Get default dock configuration
   */
  async getDefault(appId: string): Promise<DockConfiguration | null> {
    const configs = await this.query({
      appId,
      isDefault: true
    });
    return configs.length > 0 ? configs[0] : null;
  },

  /**
   * Set a configuration as default
   */
  async setAsDefault(configId: string): Promise<DockConfiguration> {
    return apiCall<DockConfiguration>(
      () => apiClient.put('/configurations/' + configId, {
        isDefault: true
      }),
      'Failed to set default configuration'
    );
  },

  /**
   * Share a configuration with other users
   */
  async share(configId: string, userIds: string[]): Promise<DockConfiguration> {
    return apiCall<DockConfiguration>(
      () => apiClient.put('/configurations/' + configId, {
        isShared: true,
        sharedWith: userIds
      }),
      'Failed to share configuration'
    );
  },

  /**
   * Export configuration as JSON
   */
  async export(configId: string): Promise<string> {
    const config = await this.loadById(configId);
    return JSON.stringify(config, null, 2);
  },

  /**
   * Import configuration from JSON
   */
  async import(jsonString: string, userId: string): Promise<DockConfiguration> {
    try {
      const config = JSON.parse(jsonString) as DockConfiguration;

      // Reset IDs and user info for new import (remove server-managed fields)
      const { configId, creationTime, lastUpdated, ...importData } = config;

      return this.save({
        ...importData,
        userId,
        createdBy: userId,
        lastUpdatedBy: userId
      } as DockConfiguration);
    } catch (error) {
      throw new Error('Invalid configuration JSON');
    }
  },

  /**
   * Validate a dock configuration
   */
  async validate(config: DockConfiguration): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      // You could call a validation endpoint if available
      // For now, do client-side validation
      const errors: string[] = [];

      if (!config.name) {
        errors.push('Configuration name is required');
      }

      if (!config.userId) {
        errors.push('User ID is required');
      }

      if (!config.config?.menuItems) {
        errors.push('Menu items are required');
      }

      // Check for duplicate IDs
      const ids = new Set<string>();
      const checkDuplicates = (items: any[]): void => {
        items?.forEach(item => {
          if (ids.has(item.id)) {
            errors.push(`Duplicate menu item ID: ${item.id}`);
          }
          ids.add(item.id);
          if (item.children) {
            checkDuplicates(item.children);
          }
        });
      };

      if (config.config?.menuItems) {
        checkDuplicates(config.config.menuItems);
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Validation failed: ' + (error as Error).message]
      };
    }
  }
};