/**
 * Configuration Service Client
 *
 * Client-side wrapper for the Configuration REST API
 * Provides type-safe CRUD operations for configurations
 */

import { apiClient } from '@/utils/api/apiClient';
import { logger } from '@/utils/logger';

export interface UnifiedConfig {
  // Identity
  configId: string;
  appId: string;
  userId: string;

  // Component Classification
  componentType: string;
  componentSubType?: string;

  // Display
  name: string;
  description?: string;
  icon?: string;

  // Configuration Data
  config: any;
  settings: ConfigVersion[];
  activeSetting: string;

  // Metadata
  tags?: string[];
  category?: string;
  isShared?: boolean;
  isDefault?: boolean;
  isLocked?: boolean;

  // Audit
  createdBy: string;
  lastUpdatedBy: string;
  creationTime: Date;
  lastUpdated: Date;

  // Soft Delete
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

export interface ConfigVersion {
  versionId: string;
  name: string;
  description?: string;
  config: any;
  createdTime: Date;
  updatedTime: Date;
  isActive: boolean;
  metadata?: any;
}

export interface CreateConfigRequest {
  appId: string;
  userId: string;
  componentType: string;
  componentSubType?: string;
  name: string;
  description?: string;
  icon?: string;
  config: any;
  settings?: ConfigVersion[];
  activeSetting?: string;
  tags?: string[];
  category?: string;
  isShared?: boolean;
  isDefault?: boolean;
  isLocked?: boolean;
  createdBy: string;
  lastUpdatedBy: string;
}

export interface UpdateConfigRequest {
  name?: string;
  config?: Record<string, any>;
  settings?: ConfigVersion[];
}

class ConfigurationService {
  private baseUrl = '/configurations';

  /**
   * Get configuration by ID
   */
  async getById(configId: string): Promise<UnifiedConfig> {
    try {
      logger.debug('Fetching configuration', { configId }, 'ConfigurationService');

      const response = await apiClient.get(`${this.baseUrl}/${configId}`);

      logger.info('Configuration fetched', { configId }, 'ConfigurationService');

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch configuration', error, 'ConfigurationService');
      throw error;
    }
  }

  /**
   * Get all configurations (with optional filters)
   */
  async getAll(filters?: {
    componentType?: string;
    componentSubType?: string;
    userId?: string;
  }): Promise<UnifiedConfig[]> {
    try {
      logger.debug('Fetching all configurations', { filters }, 'ConfigurationService');

      const params = new URLSearchParams();
      if (filters?.componentType) params.append('componentType', filters.componentType);
      if (filters?.componentSubType) params.append('componentSubType', filters.componentSubType);
      if (filters?.userId) params.append('userId', filters.userId);

      const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
      const response = await apiClient.get(url);

      logger.info('Configurations fetched', { count: response.data.length }, 'ConfigurationService');

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch configurations', error, 'ConfigurationService');
      throw error;
    }
  }

  /**
   * Create new configuration
   */
  async create(data: CreateConfigRequest): Promise<UnifiedConfig> {
    try {
      logger.debug('Creating configuration', { name: data.name }, 'ConfigurationService');

      const response = await apiClient.post(this.baseUrl, data);

      logger.info('Configuration created', { configId: response.data.configId }, 'ConfigurationService');

      return response.data;
    } catch (error) {
      logger.error('Failed to create configuration', error, 'ConfigurationService');
      throw error;
    }
  }

  /**
   * Update configuration
   */
  async update(configId: string, data: UpdateConfigRequest): Promise<UnifiedConfig> {
    try {
      logger.debug('Updating configuration', { configId, updates: Object.keys(data) }, 'ConfigurationService');

      const response = await apiClient.put(`${this.baseUrl}/${configId}`, data);

      logger.info('Configuration updated', { configId }, 'ConfigurationService');

      return response.data;
    } catch (error) {
      logger.error('Failed to update configuration', error, 'ConfigurationService');
      throw error;
    }
  }

  /**
   * Delete configuration
   */
  async delete(configId: string): Promise<void> {
    try {
      logger.debug('Deleting configuration', { configId }, 'ConfigurationService');

      await apiClient.delete(`${this.baseUrl}/${configId}`);

      logger.info('Configuration deleted', { configId }, 'ConfigurationService');
    } catch (error) {
      logger.error('Failed to delete configuration', error, 'ConfigurationService');
      throw error;
    }
  }

  /**
   * Clone configuration (creates a copy with new ID)
   */
  async clone(configId: string, newName: string, userId?: string): Promise<UnifiedConfig> {
    try {
      logger.debug('Cloning configuration', { configId, newName }, 'ConfigurationService');

      // Get original config
      const original = await this.getById(configId);

      // Create new config with cloned data
      const cloned = await this.create({
        name: newName,
        componentType: original.componentType,
        componentSubType: original.componentSubType,
        config: original.config,
        settings: original.settings,
        userId: userId || original.userId,
        createdBy: original.createdBy,
        appId: original.appId,
        lastUpdatedBy: userId || original.userId
      });

      logger.info('Configuration cloned', {
        originalId: configId,
        clonedId: cloned.configId
      }, 'ConfigurationService');

      return cloned;
    } catch (error) {
      logger.error('Failed to clone configuration', error, 'ConfigurationService');
      throw error;
    }
  }

  /**
   * Find configuration by composite key (userId, componentType, name)
   * More efficient than getAll() + client-side filter
   */
  async findByCompositeKey(
    userId: string,
    componentType: string,
    name: string,
    componentSubType?: string
  ): Promise<UnifiedConfig | null> {
    try {
      logger.debug('Finding configuration by composite key', {
        userId,
        componentType,
        componentSubType,
        name
      }, 'ConfigurationService');

      const params = new URLSearchParams({
        userId,
        componentType,
        name,
      });

      if (componentSubType) {
        params.append('componentSubType', componentSubType);
      }

      const response = await apiClient.get(`${this.baseUrl}/lookup?${params}`);

      logger.info('Configuration found by composite key', {
        configId: response.data.configId
      }, 'ConfigurationService');

      return response.data;
    } catch (error: any) {
      // Handle 404 as null (not found)
      if (error.response?.status === 404) {
        logger.debug('Configuration not found by composite key', {
          userId,
          componentType,
          componentSubType,
          name
        }, 'ConfigurationService');
        return null;
      }

      logger.error('Failed to find configuration by composite key', error, 'ConfigurationService');
      throw error;
    }
  }

  /**
   * Upsert configuration by composite key
   * Creates if not exists, updates if exists
   */
  async upsert(
    userId: string,
    componentType: string,
    name: string,
    configData: any,
    componentSubType?: string,
    appId?: string
  ): Promise<UnifiedConfig> {
    try {
      logger.debug('Upserting configuration', {
        userId,
        componentType,
        componentSubType,
        name
      }, 'ConfigurationService');

      // Try to find existing
      const existing = await this.findByCompositeKey(
        userId,
        componentType,
        name,
        componentSubType
      );

      if (existing) {
        // Update existing
        logger.debug('Config exists, updating', { configId: existing.configId }, 'ConfigurationService');
        return await this.update(existing.configId, { config: configData });
      } else {
        // Create new
        logger.debug('Config does not exist, creating new', undefined, 'ConfigurationService');

        const defaultVersionId = crypto.randomUUID();
        const now = new Date();

        return await this.create({
          appId: appId || 'default-app',
          userId,
          componentType,
          componentSubType,
          name,
          config: configData,
          settings: [
            {
              versionId: defaultVersionId,
              name: 'Default',
              description: 'Initial configuration',
              config: configData,
              createdTime: now,
              updatedTime: now,
              isActive: true,
              metadata: {}
            }
          ],
          activeSetting: defaultVersionId,
          createdBy: userId,
          lastUpdatedBy: userId
        });
      }
    } catch (error) {
      logger.error('Failed to upsert configuration', error, 'ConfigurationService');
      throw error;
    }
  }
}

// Export singleton instance
export const configService = new ConfigurationService();
