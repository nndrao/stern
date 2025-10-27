/**
 * DataProvider Configuration Service
 *
 * Wrapper around ConfigurationService for managing DataProvider configurations
 * Providers are stored as UnifiedConfig with componentType='datasource'
 */

import { apiClient } from '@/utils/api/apiClient';
import {
  UnifiedConfig,
  COMPONENT_TYPES,
  DataProviderConfig,
  ProviderType,
  ProviderConfig,
  PROVIDER_TYPE_TO_COMPONENT_SUBTYPE,
  COMPONENT_SUBTYPE_TO_PROVIDER_TYPE
} from '@stern/shared-types';
import { logger } from '@/utils/logger';

export class DataProviderConfigService {
  private readonly baseUrl = '/configurations';

  /**
   * Convert DataProviderConfig to UnifiedConfig format
   * Uses componentType='DataProvider' (not 'datasource')
   * componentSubType is the specific provider type (Stomp, Rest, etc.)
   */
  private toUnifiedConfig(provider: DataProviderConfig, userId: string): Partial<UnifiedConfig> {
    // Use enum mapping to convert provider type to component subtype
    const componentSubType = PROVIDER_TYPE_TO_COMPONENT_SUBTYPE[provider.providerType];

    if (!componentSubType) {
      throw new Error(`Unknown provider type: ${provider.providerType}`);
    }

    return {
      configId: provider.providerId,
      appId: 'stern-platform',
      userId: userId,
      componentType: COMPONENT_TYPES.DATA_PROVIDER,
      componentSubType: componentSubType,
      name: provider.name,
      description: provider.description,
      config: provider.config as Record<string, unknown>,
      settings: [],
      activeSetting: 'default',
      tags: provider.tags || [],
      isDefault: provider.isDefault || false,
      createdBy: userId,
      lastUpdatedBy: userId
    };
  }

  /**
   * Convert UnifiedConfig to DataProviderConfig format
   * Uses enum mapping to convert componentSubType to providerType
   */
  private fromUnifiedConfig(config: UnifiedConfig): DataProviderConfig {
    // Use enum mapping to convert component subtype to provider type
    const providerType = COMPONENT_SUBTYPE_TO_PROVIDER_TYPE[config.componentSubType || ''];

    if (!providerType) {
      throw new Error(`Unknown component subtype: ${config.componentSubType}`);
    }

    return {
      providerId: config.configId,
      name: config.name,
      description: config.description,
      providerType: providerType,
      config: config.config as ProviderConfig,
      tags: config.tags,
      isDefault: config.isDefault,
      userId: config.userId
    };
  }

  /**
   * Create a new data provider configuration
   */
  async create(provider: DataProviderConfig, userId: string): Promise<DataProviderConfig> {
    try {
      logger.info('Creating data provider', { name: provider.name, type: provider.providerType }, 'DataProviderConfigService');

      const unifiedConfig = this.toUnifiedConfig(provider, userId);
      const response = await apiClient.post<UnifiedConfig>(this.baseUrl, unifiedConfig);

      logger.info('Data provider created', { providerId: response.data.configId }, 'DataProviderConfigService');

      return this.fromUnifiedConfig(response.data);
    } catch (error) {
      logger.error('Failed to create data provider', error, 'DataProviderConfigService');
      throw error;
    }
  }

  /**
   * Update an existing data provider configuration
   */
  async update(providerId: string, updates: Partial<DataProviderConfig>, userId: string): Promise<DataProviderConfig> {
    try {
      logger.info('Updating data provider', { providerId }, 'DataProviderConfigService');

      const unifiedUpdates: Partial<UnifiedConfig> = {
        name: updates.name,
        description: updates.description,
        componentSubType: updates.providerType,
        config: updates.config as Record<string, unknown>,
        tags: updates.tags,
        isDefault: updates.isDefault,
        lastUpdatedBy: userId,
        lastUpdated: new Date()
      };

      const response = await apiClient.put<UnifiedConfig>(`${this.baseUrl}/${providerId}`, unifiedUpdates);

      logger.info('Data provider updated', { providerId }, 'DataProviderConfigService');

      return this.fromUnifiedConfig(response.data);
    } catch (error) {
      logger.error('Failed to update data provider', error, 'DataProviderConfigService');
      throw error;
    }
  }

  /**
   * Delete a data provider configuration (soft delete)
   */
  async delete(providerId: string): Promise<void> {
    try {
      logger.info('Deleting data provider', { providerId }, 'DataProviderConfigService');

      await apiClient.delete(`${this.baseUrl}/${providerId}`);

      logger.info('Data provider deleted', { providerId }, 'DataProviderConfigService');
    } catch (error) {
      logger.error('Failed to delete data provider', error, 'DataProviderConfigService');
      throw error;
    }
  }

  /**
   * Get a data provider by ID
   */
  async getById(providerId: string): Promise<DataProviderConfig | null> {
    try {
      logger.debug('Fetching data provider by ID', { providerId }, 'DataProviderConfigService');

      const response = await apiClient.get<UnifiedConfig>(`${this.baseUrl}/${providerId}`);

      if (!response.data) {
        return null;
      }

      return this.fromUnifiedConfig(response.data);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      logger.error('Failed to fetch data provider', error, 'DataProviderConfigService');
      throw error;
    }
  }

  /**
   * Get all data providers for a user
   */
  async getByUser(userId: string): Promise<DataProviderConfig[]> {
    try {
      logger.debug('Fetching data providers by user', { userId }, 'DataProviderConfigService');

      const response = await apiClient.get<UnifiedConfig[]>(`${this.baseUrl}/by-user/${userId}`, {
        params: { includeDeleted: false }
      });

      // Filter by componentType=DataProvider (new structure)
      const providers = response.data
        .filter(config => config.componentType === COMPONENT_TYPES.DATA_PROVIDER)
        .map(config => this.fromUnifiedConfig(config));

      logger.debug('Data providers fetched', { count: providers.length }, 'DataProviderConfigService');

      return providers;
    } catch (error) {
      logger.error('Failed to fetch data providers by user', error, 'DataProviderConfigService');
      throw error;
    }
  }

  /**
   * Get all data providers of a specific type
   */
  async getByType(providerType: ProviderType, userId?: string): Promise<DataProviderConfig[]> {
    try {
      logger.debug('Fetching data providers by type', { providerType, userId }, 'DataProviderConfigService');

      const response = await apiClient.get<UnifiedConfig[]>(`${this.baseUrl}/by-component/${COMPONENT_TYPES.DATA_PROVIDER}`, {
        params: {
          componentSubType: providerType,
          includeDeleted: false
        }
      });

      let providers = response.data.map(config => this.fromUnifiedConfig(config));

      // Filter by userId if provided
      if (userId) {
        providers = providers.filter(p => p.userId === userId);
      }

      logger.debug('Data providers fetched', { count: providers.length }, 'DataProviderConfigService');

      return providers;
    } catch (error) {
      logger.error('Failed to fetch data providers by type', error, 'DataProviderConfigService');
      throw error;
    }
  }

  /**
   * Clone an existing data provider
   */
  async clone(providerId: string, newName: string, userId: string): Promise<DataProviderConfig> {
    try {
      logger.info('Cloning data provider', { providerId, newName }, 'DataProviderConfigService');

      const response = await apiClient.post<UnifiedConfig>(`${this.baseUrl}/${providerId}/clone`, {
        newName,
        userId
      });

      logger.info('Data provider cloned', {
        originalId: providerId,
        newId: response.data.configId
      }, 'DataProviderConfigService');

      return this.fromUnifiedConfig(response.data);
    } catch (error) {
      logger.error('Failed to clone data provider', error, 'DataProviderConfigService');
      throw error;
    }
  }

  /**
   * Get the default data provider for a user
   */
  async getDefault(userId: string): Promise<DataProviderConfig | null> {
    try {
      logger.debug('Fetching default data provider', { userId }, 'DataProviderConfigService');

      const providers = await this.getByUser(userId);
      const defaultProvider = providers.find(p => p.isDefault);

      if (defaultProvider) {
        logger.debug('Default data provider found', { providerId: defaultProvider.providerId }, 'DataProviderConfigService');
      } else {
        logger.debug('No default data provider found', undefined, 'DataProviderConfigService');
      }

      return defaultProvider || null;
    } catch (error) {
      logger.error('Failed to fetch default data provider', error, 'DataProviderConfigService');
      throw error;
    }
  }

  /**
   * Set a data provider as default
   */
  async setDefault(providerId: string, userId: string): Promise<void> {
    try {
      logger.info('Setting default data provider', { providerId }, 'DataProviderConfigService');

      // First, unset any existing default
      const providers = await this.getByUser(userId);
      const currentDefault = providers.find(p => p.isDefault);

      if (currentDefault && currentDefault.providerId !== providerId) {
        await this.update(currentDefault.providerId!, { isDefault: false }, userId);
      }

      // Set the new default
      await this.update(providerId, { isDefault: true }, userId);

      logger.info('Default data provider set', { providerId }, 'DataProviderConfigService');
    } catch (error) {
      logger.error('Failed to set default data provider', error, 'DataProviderConfigService');
      throw error;
    }
  }

  /**
   * Search data providers by name or description
   */
  async search(query: string, userId: string): Promise<DataProviderConfig[]> {
    try {
      logger.debug('Searching data providers', { query, userId }, 'DataProviderConfigService');

      const allProviders = await this.getByUser(userId);

      const searchTerm = query.toLowerCase();
      const filtered = allProviders.filter(provider =>
        provider.name.toLowerCase().includes(searchTerm) ||
        provider.description?.toLowerCase().includes(searchTerm) ||
        provider.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );

      logger.debug('Search results', { count: filtered.length }, 'DataProviderConfigService');

      return filtered;
    } catch (error) {
      logger.error('Failed to search data providers', error, 'DataProviderConfigService');
      throw error;
    }
  }
}

// Export singleton instance
export const dataProviderConfigService = new DataProviderConfigService();
