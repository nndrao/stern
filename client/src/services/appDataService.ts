/**
 * AppData Service
 *
 * Central service for managing AppData providers - global application variables
 * that can be shared across all OpenFin windows/views.
 *
 * Features:
 * - Load all AppData providers from database
 * - Register providers and inject variables into templateResolver
 * - Update variables and broadcast changes via IAB
 * - Persist changes to database
 * - Provide variables to React components via useAppData hook
 *
 * Variable Access Syntax:
 * - In templates: {AppData.ProviderName.variableName}
 * - In React: appData.get('AppData.ProviderName.variableName')
 */

import { TemplateResolver } from './templateResolver';
import { OpenFinCustomEvents } from '@/openfin/types/openfinEvents';
import { logger } from '@/utils/logger';
import { dataProviderConfigService } from './api/dataProviderConfigService';
import {
  DataProviderConfig,
  PROVIDER_TYPES
} from '@stern/shared-types';

export class AppDataService {
  private static instance: AppDataService;
  private providers: Map<string, DataProviderConfig> = new Map();
  private isInitialized: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AppDataService {
    if (!AppDataService.instance) {
      AppDataService.instance = new AppDataService();
    }
    return AppDataService.instance;
  }

  /**
   * Load all AppData providers from database
   * Called on platform initialization
   * Uses dataProviderConfigService for consistency
   */
  async loadAllProviders(userId: string): Promise<void> {
    try {
      logger.info('Loading AppData providers from database...', { userId }, 'AppDataService');

      // Fetch AppData providers using the service
      const appDataProviders = await dataProviderConfigService.getByType(PROVIDER_TYPES.APPDATA, userId);

      logger.info('Found AppData providers', {
        appDataCount: appDataProviders.length
      }, 'AppDataService');

      // Register each provider
      for (const provider of appDataProviders) {
        this.registerProvider(provider);
      }

      this.isInitialized = true;

      logger.info('AppData providers loaded successfully', {
        count: appDataProviders.length,
        providerNames: appDataProviders.map(p => p.name)
      }, 'AppDataService');

    } catch (error) {
      logger.error('Failed to load AppData providers', error, 'AppDataService');
      throw error;
    }
  }

  /**
   * Register a single AppData provider
   * Injects all variables into templateResolver for global access
   */
  registerProvider(provider: DataProviderConfig): void {
    if (provider.providerType !== PROVIDER_TYPES.APPDATA) {
      logger.warn('Attempted to register non-AppData provider', {
        providerId: provider.providerId,
        type: provider.providerType
      }, 'AppDataService');
      return;
    }

    const config = provider.config as AppDataProviderConfig;
    const providerId = provider.providerId || provider.name;

    // Store provider
    this.providers.set(providerId, provider);

    // Inject variables into templateResolver
    // Syntax: AppData.ProviderName.variableName
    const datasourceName = `AppData.${provider.name}`;

    const variableCount = Object.keys(config.variables || {}).length;
    logger.info('Registering AppData provider', {
      providerId,
      providerName: provider.name,
      variableCount,
      datasourceName
    }, 'AppDataService');

    // Inject each variable
    for (const [key, variable] of Object.entries(config.variables || {})) {
      TemplateResolver.setVariableValue(
        datasourceName,
        variable.key,
        variable.value
      );

      logger.debug('Injected variable', {
        fullPath: `{${datasourceName}.${variable.key}}`,
        type: variable.type,
        valuePreview: variable.sensitive ? '***' : String(variable.value).substring(0, 50)
      }, 'AppDataService');
    }
  }

  /**
   * Update a single variable and broadcast change
   *
   * @param providerId ID of the AppData provider
   * @param variableKey Key of the variable to update
   * @param value New value
   */
  async updateVariable(providerId: string, variableKey: string, value: any): Promise<void> {
    try {
      const provider = this.providers.get(providerId);
      if (!provider) {
        throw new Error(`AppData provider not found: ${providerId}`);
      }

      const config = provider.config as AppDataProviderConfig;

      if (!config.variables[variableKey]) {
        throw new Error(`Variable not found: ${variableKey}`);
      }

      logger.info('Updating AppData variable', {
        providerId,
        providerName: provider.name,
        variableKey,
        oldValue: config.variables[variableKey].sensitive ? '***' : config.variables[variableKey].value,
        newValue: config.variables[variableKey].sensitive ? '***' : value
      }, 'AppDataService');

      // Update in memory
      config.variables[variableKey].value = value;

      // Update templateResolver
      const datasourceName = `AppData.${provider.name}`;
      TemplateResolver.setVariableValue(datasourceName, variableKey, value);

      // Broadcast to all windows/views via IAB
      if (typeof window !== 'undefined' && window.fin) {
        try {
          await fin.InterApplicationBus.publish(
            OpenFinCustomEvents.APPDATA_UPDATED,
            {
              providerId,
              providerName: provider.name,
              variables: this.getProviderVariablesFlat(provider),
              updatedKeys: [variableKey],
              timestamp: Date.now()
            }
          );

          logger.debug('Broadcasted AppData update via IAB', {
            providerId,
            updatedKeys: [variableKey]
          }, 'AppDataService');
        } catch (iabError) {
          logger.warn('Failed to broadcast AppData update via IAB', iabError, 'AppDataService');
        }
      }

      // Persist to database
      await this.saveProvider(provider);

      logger.info('AppData variable updated successfully', {
        providerId,
        variableKey
      }, 'AppDataService');

    } catch (error) {
      logger.error('Failed to update AppData variable', error, 'AppDataService');
      throw error;
    }
  }

  /**
   * Save provider to database
   * Uses dataProviderConfigService for consistency
   */
  private async saveProvider(provider: DataProviderConfig): Promise<void> {
    try {
      if (provider.providerId) {
        // Update existing provider
        await dataProviderConfigService.update(
          provider.providerId,
          provider,
          provider.userId
        );
        logger.debug('Provider updated in database', {
          providerId: provider.providerId
        }, 'AppDataService');
      } else {
        // Create new provider
        const created = await dataProviderConfigService.create(provider, provider.userId);
        provider.providerId = created.providerId;
        logger.debug('Provider created in database', {
          providerId: created.providerId
        }, 'AppDataService');
      }
    } catch (error) {
      logger.error('Failed to save provider to database', error, 'AppDataService');
      throw error;
    }
  }

  /**
   * Get all variables as flat object for a single provider
   * Used for broadcasting updates
   */
  private getProviderVariablesFlat(provider: DataProviderConfig): Record<string, any> {
    const config = provider.config as AppDataProviderConfig;
    const flat: Record<string, any> = {};

    for (const [key, variable] of Object.entries(config.variables || {})) {
      flat[variable.key] = variable.value;
    }

    return flat;
  }

  /**
   * Get all variables from all providers as flat object
   * Format: { 'AppData.Provider1.var1': value1, 'AppData.Provider2.var2': value2, ... }
   *
   * Used for:
   * - Injecting into new windows/views
   * - useAppData hook initialization
   */
  getAllVariables(): Record<string, any> {
    const allVars: Record<string, any> = {};

    for (const [providerId, provider] of this.providers) {
      const config = provider.config as AppDataProviderConfig;
      const prefix = `AppData.${provider.name}`;

      for (const [key, variable] of Object.entries(config.variables || {})) {
        const fullKey = `${prefix}.${variable.key}`;
        allVars[fullKey] = variable.value;
      }
    }

    return allVars;
  }

  /**
   * Get a specific provider by ID
   */
  getProvider(providerId: string): DataProviderConfig | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get all providers
   */
  getAllProviders(): DataProviderConfig[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Clear all providers (for testing/cleanup)
   */
  clear(): void {
    this.providers.clear();
    this.isInitialized = false;
    logger.info('AppData service cleared', undefined, 'AppDataService');
  }
}

// Export singleton instance
export const appDataService = AppDataService.getInstance();
