/**
 * useAppData Hook
 *
 * React hook for accessing AppData variables in any component across all windows/views
 *
 * Features:
 * - Automatically loads AppData from platform context on mount
 * - Subscribes to real-time updates via IAB
 * - Provides type-safe variable access
 * - Works in both OpenFin and browser environments
 *
 * Usage:
 * ```typescript
 * function MyComponent() {
 *   const appData = useAppData();
 *
 *   const token = appData.get('AppData.Tokens.rest-token');
 *   const apiUrl = appData.get('AppData.Config.api-url');
 *
 *   // Use in API calls, headers, etc.
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { OpenFinCustomEvents } from '@/openfin/types/openfinEvents';
import { logger } from '@/utils/logger';
import { appDataService } from '@/services/appDataService';

export interface UseAppDataReturn {
  /**
   * All AppData variables
   * Format: { 'AppData.Provider.variable': value, ... }
   */
  variables: Record<string, any>;

  /**
   * Get a specific variable by full path
   * @param key Full path: 'AppData.ProviderName.variableName'
   * @returns Variable value or undefined if not found
   */
  get: (key: string) => any;

  /**
   * Check if a variable exists
   * @param key Full path: 'AppData.ProviderName.variableName'
   * @returns true if variable exists
   */
  has: (key: string) => boolean;

  /**
   * Is AppData ready/loaded
   */
  isReady: boolean;
}

export function useAppData(): UseAppDataReturn {
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [isReady, setIsReady] = useState(false);

  // Load initial AppData
  useEffect(() => {
    const loadAppData = async () => {
      try {
        // In OpenFin environment
        if (typeof window !== 'undefined' && window.fin) {
          logger.debug('Loading AppData from service...', undefined, 'useAppData');

          // Get all variables from service
          const allVars = appDataService.getAllVariables();

          logger.info('AppData loaded', {
            variableCount: Object.keys(allVars).length,
            variables: Object.keys(allVars)
          }, 'useAppData');

          setVariables(allVars);
          setIsReady(true);
        } else {
          // In browser environment (development)
          logger.warn('Not in OpenFin environment - AppData will be empty', undefined, 'useAppData');
          setIsReady(true);
        }
      } catch (error) {
        logger.error('Failed to load AppData', error, 'useAppData');
        setIsReady(true); // Mark as ready even on error
      }
    };

    loadAppData();
  }, []);

  // Subscribe to AppData updates via IAB
  useEffect(() => {
    if (typeof window === 'undefined' || !window.fin) {
      return; // Not in OpenFin
    }

    let isSubscribed = true;

    const subscribeToUpdates = async () => {
      try {
        logger.debug('Subscribing to AppData updates...', undefined, 'useAppData');

        // Subscribe to AppData update events
        const listener = (data: any) => {
          if (!isSubscribed) return;

          logger.info('AppData update received', {
            providerId: data.providerId,
            providerName: data.providerName,
            updatedKeys: data.updatedKeys
          }, 'useAppData');

          // Merge updated variables into state
          setVariables(prev => {
            const updated = { ...prev };

            // Update the changed variables
            for (const key of data.updatedKeys) {
              const fullKey = `AppData.${data.providerName}.${key}`;
              updated[fullKey] = data.variables[key];
            }

            return updated;
          });
        };

        // Subscribe to IAB event
        await fin.InterApplicationBus.subscribe(
          { uuid: '*' },
          OpenFinCustomEvents.APPDATA_UPDATED,
          listener
        );

        logger.debug('Subscribed to AppData updates', undefined, 'useAppData');

        // Cleanup function
        return async () => {
          isSubscribed = false;
          try {
            await fin.InterApplicationBus.unsubscribe(
              { uuid: '*' },
              OpenFinCustomEvents.APPDATA_UPDATED,
              listener
            );
            logger.debug('Unsubscribed from AppData updates', undefined, 'useAppData');
          } catch (error) {
            logger.warn('Error unsubscribing from AppData updates', error, 'useAppData');
          }
        };
      } catch (error) {
        logger.error('Failed to subscribe to AppData updates', error, 'useAppData');
      }
    };

    subscribeToUpdates();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Get a specific variable
  const get = useCallback((key: string): any => {
    return variables[key];
  }, [variables]);

  // Check if a variable exists
  const has = useCallback((key: string): boolean => {
    return key in variables;
  }, [variables]);

  return {
    variables,
    get,
    has,
    isReady
  };
}
