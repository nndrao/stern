/**
 * SternPlatformProvider
 *
 * Top-level platform provider that wraps the entire application
 * Provides unified access to:
 * - AppData variables (auto-loaded from database)
 * - OpenFin IAB events
 * - Configuration services
 * - API base URL
 * - Platform utilities
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const platform = useSternPlatform();
 *
 *   // Access AppData
 *   const token = platform.appData.get('AppData.Tokens.rest-token');
 *
 *   // Subscribe to events
 *   platform.subscribeToEvent(OpenFinCustomEvents.THEME_CHANGE, (data) => {
 *     console.log('Theme changed:', data);
 *   });
 *
 *   // Use config services
 *   const config = await platform.configService.get(configId);
 * }
 * ```
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { appDataService } from '@/services/appDataService';
import { configService } from '@/services/configurationService';
import { dataProviderConfigService } from '@/services/dataProviderConfigService';
import { getApiUrl } from '@/openfin/utils/platformContext';
import { OpenFinCustomEvents, OpenFinEventMap } from '@/openfin/types/openfinEvents';
import { logger } from '@/utils/logger';
import { UnifiedConfig } from '@stern/shared-types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SternPlatformContextValue {
  // AppData
  appData: {
    variables: Record<string, any>;
    get: (key: string) => any;
    has: (key: string) => boolean;
    isReady: boolean;
  };

  // Config Services
  configService: typeof configService;
  dataProviderConfigService: typeof dataProviderConfigService;

  // API Configuration
  apiBaseUrl: string;
  environment: string;

  // OpenFin
  isOpenFin: boolean;
  subscribeToEvent: <K extends keyof OpenFinEventMap>(
    topic: K,
    handler: (data: OpenFinEventMap[K]) => void
  ) => () => void;
  broadcastEvent: <K extends keyof OpenFinEventMap>(
    topic: K,
    data: OpenFinEventMap[K]
  ) => Promise<void>;

  // Platform State
  isReady: boolean;
  error: Error | null;
}

const SternPlatformContext = createContext<SternPlatformContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

export interface SternPlatformProviderProps {
  children: ReactNode;
}

export const SternPlatformProvider: React.FC<SternPlatformProviderProps> = ({ children }) => {
  const [appDataVariables, setAppDataVariables] = useState<Record<string, any>>({});
  const [isAppDataReady, setIsAppDataReady] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:3001');

  const isOpenFin = typeof window !== 'undefined' && !!window.fin;

  // Initialize platform on mount
  useEffect(() => {
    const initializePlatform = async () => {
      try {
        logger.info('SternPlatformProvider initializing...', undefined, 'SternPlatformProvider');

        // Get API base URL
        const baseUrl = await getApiUrl();
        setApiBaseUrl(baseUrl);
        logger.info('API Base URL set', { baseUrl }, 'SternPlatformProvider');

        // Load AppData if in OpenFin environment
        if (isOpenFin) {
          logger.info('Loading AppData providers...', undefined, 'SternPlatformProvider');

          const userId = 'default-user'; // TODO: Get from auth service
          await appDataService.loadAllProviders(userId);

          const allVars = appDataService.getAllVariables();
          setAppDataVariables(allVars);
          setIsAppDataReady(true);

          logger.info('AppData loaded', {
            variableCount: Object.keys(allVars).length,
            variables: Object.keys(allVars)
          }, 'SternPlatformProvider');
        } else {
          // Browser mode - no AppData
          logger.info('Browser mode - AppData not available', undefined, 'SternPlatformProvider');
          setIsAppDataReady(true);
        }

        setIsReady(true);
        logger.info('SternPlatformProvider initialized successfully', undefined, 'SternPlatformProvider');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize platform');
        logger.error('SternPlatformProvider initialization failed', error, 'SternPlatformProvider');
        setError(error);
        setIsReady(true); // Mark as ready even on error to allow app to render
      }
    };

    initializePlatform();
  }, [isOpenFin]);

  // Subscribe to AppData updates via IAB
  useEffect(() => {
    if (!isOpenFin) return;

    let isSubscribed = true;

    const subscribeToAppDataUpdates = async () => {
      try {
        logger.debug('Subscribing to AppData updates...', undefined, 'SternPlatformProvider');

        const listener = (data: any) => {
          if (!isSubscribed) return;

          logger.info('AppData update received', {
            providerId: data.providerId,
            providerName: data.providerName,
            updatedKeys: data.updatedKeys
          }, 'SternPlatformProvider');

          // Merge updated variables into state
          setAppDataVariables(prev => {
            const updated = { ...prev };
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

        logger.debug('Subscribed to AppData updates', undefined, 'SternPlatformProvider');

        // Cleanup
        return async () => {
          isSubscribed = false;
          try {
            await fin.InterApplicationBus.unsubscribe(
              { uuid: '*' },
              OpenFinCustomEvents.APPDATA_UPDATED,
              listener
            );
            logger.debug('Unsubscribed from AppData updates', undefined, 'SternPlatformProvider');
          } catch (error) {
            logger.warn('Error unsubscribing from AppData updates', error, 'SternPlatformProvider');
          }
        };
      } catch (error) {
        logger.error('Failed to subscribe to AppData updates', error, 'SternPlatformProvider');
      }
    };

    subscribeToAppDataUpdates();

    return () => {
      isSubscribed = false;
    };
  }, [isOpenFin]);

  // Get AppData variable by key
  const getAppDataVariable = useCallback((key: string): any => {
    return appDataVariables[key];
  }, [appDataVariables]);

  // Check if AppData variable exists
  const hasAppDataVariable = useCallback((key: string): boolean => {
    return key in appDataVariables;
  }, [appDataVariables]);

  // Subscribe to OpenFin IAB event
  const subscribeToEvent = useCallback(<K extends keyof OpenFinEventMap>(
    topic: K,
    handler: (data: OpenFinEventMap[K]) => void
  ): (() => void) => {
    if (!isOpenFin) {
      logger.warn('subscribeToEvent called in browser mode - no-op', { topic }, 'SternPlatformProvider');
      return () => {};
    }

    logger.debug('Subscribing to event', { topic }, 'SternPlatformProvider');

    const listener = (data: any) => {
      handler(data as OpenFinEventMap[K]);
    };

    fin.InterApplicationBus.subscribe(
      { uuid: '*' },
      topic as string,
      listener
    ).catch(error => {
      logger.error('Failed to subscribe to event', error, 'SternPlatformProvider');
    });

    // Return cleanup function
    return () => {
      fin.InterApplicationBus.unsubscribe(
        { uuid: '*' },
        topic as string,
        listener
      ).catch(error => {
        logger.warn('Failed to unsubscribe from event', error, 'SternPlatformProvider');
      });
    };
  }, [isOpenFin]);

  // Broadcast OpenFin IAB event
  const broadcastEvent = useCallback(async <K extends keyof OpenFinEventMap>(
    topic: K,
    data: OpenFinEventMap[K]
  ): Promise<void> => {
    if (!isOpenFin) {
      logger.warn('broadcastEvent called in browser mode - no-op', { topic }, 'SternPlatformProvider');
      return;
    }

    logger.debug('Broadcasting event', { topic, data }, 'SternPlatformProvider');

    try {
      await fin.InterApplicationBus.publish(topic as string, data);
      logger.debug('Event broadcasted successfully', { topic }, 'SternPlatformProvider');
    } catch (error) {
      logger.error('Failed to broadcast event', error, 'SternPlatformProvider');
      throw error;
    }
  }, [isOpenFin]);

  // Context value
  const contextValue: SternPlatformContextValue = {
    appData: {
      variables: appDataVariables,
      get: getAppDataVariable,
      has: hasAppDataVariable,
      isReady: isAppDataReady,
    },
    configService,
    dataProviderConfigService,
    apiBaseUrl,
    environment: isOpenFin ? 'openfin' : 'browser',
    isOpenFin,
    subscribeToEvent,
    broadcastEvent,
    isReady,
    error,
  };

  // Show loading state while initializing
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Initializing Stern Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <SternPlatformContext.Provider value={contextValue}>
      {children}
    </SternPlatformContext.Provider>
  );
};

// ============================================================================
// Hook: useSternPlatform
// ============================================================================

/**
 * Hook to access Stern Platform context
 * Provides unified access to all platform services
 */
export const useSternPlatform = (): SternPlatformContextValue => {
  const context = useContext(SternPlatformContext);

  if (!context) {
    throw new Error('useSternPlatform must be used within SternPlatformProvider');
  }

  return context;
};
