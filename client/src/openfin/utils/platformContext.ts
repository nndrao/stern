/**
 * Platform Context Utility
 *
 * Reads configuration from OpenFin window/view customData object.
 * Provides access to environment-specific settings like API URLs, user identity, and app identity.
 *
 * Supports multiple contexts: Window, View, or fin.me
 *
 * Example manifest structure:
 * {
 *   "platform": {
 *     "uuid": "stern-platform",
 *     "defaultWindowOptions": {
 *       "customData": {
 *         "platformContext": {
 *           "apiUrl": "http://localhost:3001",
 *           "environment": "local",
 *           "userId": "john.doe"
 *         },
 *         "appId": "main-window",
 *         "userId": "john.doe"
 *       }
 *     },
 *     "defaultViewOptions": {
 *       "customData": {
 *         "platformContext": {
 *           "apiUrl": "http://localhost:3001",
 *           "environment": "local",
 *           "userId": "john.doe"
 *         },
 *         "appId": "demo-component-view",
 *         "userId": "john.doe"
 *       }
 *     }
 *   }
 * }
 *
 * Usage:
 * - getAppId() - Returns unique app/component identifier for config management
 * - getUserId() - Returns user identifier for user-specific configurations
 * - getPlatformContext() - Returns full platform context with apiUrl, environment, etc.
 */

import { logger } from '@/utils/logger';

/**
 * Platform context structure from manifest
 */
export interface PlatformContext {
  apiUrl?: string;
  environment?: string;
  userId?: string;
  [key: string]: any; // Allow additional custom properties
}

/**
 * Default context values when not running in OpenFin or context not defined
 */
const DEFAULT_CONTEXT: PlatformContext = {
  apiUrl: 'http://localhost:3001',
  environment: 'local'
};

// Cache the platform context to avoid repeated async calls
let cachedContext: PlatformContext | null = null;
let isContextLoading = false;
let contextLoadPromise: Promise<PlatformContext> | null = null;

/**
 * Check if running in OpenFin environment
 */
function isOpenFin(): boolean {
  return typeof window !== 'undefined' && typeof window.fin !== 'undefined';
}

/**
 * Get platform context from OpenFin manifest
 * Returns cached value if available, otherwise fetches from platform API
 */
export async function getPlatformContext(): Promise<PlatformContext> {
  // Return cached context if already loaded
  if (cachedContext) {
    return cachedContext;
  }

  // If context is currently being loaded, wait for that promise
  if (isContextLoading && contextLoadPromise) {
    return contextLoadPromise;
  }

  // Not in OpenFin environment - return defaults
  if (!isOpenFin()) {
    logger.debug('Not in OpenFin environment, using default context', DEFAULT_CONTEXT, 'platformContext');
    cachedContext = { ...DEFAULT_CONTEXT };
    return cachedContext;
  }

  // Load context from OpenFin platform
  isContextLoading = true;
  contextLoadPromise = loadPlatformContext();

  try {
    cachedContext = await contextLoadPromise;
    return cachedContext;
  } finally {
    isContextLoading = false;
    contextLoadPromise = null;
  }
}

/**
 * Internal function to load context from OpenFin platform API
 */
async function loadPlatformContext(): Promise<PlatformContext> {
  try {
    let customData: any = null;

    // Try to get customData from current context (could be Window or View)
    try {
      // First try as a Window
      const currentWindow = fin.Window.getCurrentSync();
      const windowOptions = await currentWindow.getOptions();
      customData = (windowOptions as any).customData;
      logger.debug('Got customData from Window context', undefined, 'platformContext');
    } catch (windowError) {
      // Not a window context, try as a View
      try {
        const currentView = await fin.View.getCurrent();
        const viewOptions = await currentView.getOptions();
        customData = (viewOptions as any).customData;
        logger.debug('Got customData from View context', undefined, 'platformContext');
      } catch (viewError) {
        // Not a view either, try fin.me
        try {
          const options = await fin.me.getOptions();
          customData = (options as any).customData;
          logger.debug('Got customData from fin.me context', undefined, 'platformContext');
        } catch (meError) {
          logger.warn('Could not get customData from any context', undefined, 'platformContext');
        }
      }
    }

    // Extract context from customData (this is the standard OpenFin pattern)
    const context = customData?.platformContext || {};

    if (!context || Object.keys(context).length === 0) {
      logger.warn('Platform context is empty, using defaults', undefined, 'platformContext');
      return { ...DEFAULT_CONTEXT };
    }

    logger.info('Platform context loaded', context, 'platformContext');

    // Merge with defaults to ensure required properties exist
    return {
      ...DEFAULT_CONTEXT,
      ...context
    };
  } catch (error) {
    logger.error('Failed to load platform context, using defaults', error, 'platformContext');
    return { ...DEFAULT_CONTEXT };
  }
}

/**
 * Synchronously get platform context if already loaded
 * Returns null if not yet loaded - use getPlatformContext() to load asynchronously
 */
export function getPlatformContextSync(): PlatformContext | null {
  return cachedContext;
}

/**
 * Get API URL from platform context
 * Convenience function that handles async loading
 */
export async function getApiUrl(): Promise<string> {
  const context = await getPlatformContext();
  return context.apiUrl || DEFAULT_CONTEXT.apiUrl!;
}

/**
 * Get environment from platform context
 */
export async function getEnvironment(): Promise<string> {
  const context = await getPlatformContext();
  return context.environment || DEFAULT_CONTEXT.environment!;
}

/**
 * Clear cached context (useful for testing or hot-reload scenarios)
 */
export function clearContextCache(): void {
  cachedContext = null;
  isContextLoading = false;
  contextLoadPromise = null;
  logger.debug('Platform context cache cleared', undefined, 'platformContext');
}

/**
 * Check if platform context has been loaded
 */
export function isContextLoaded(): boolean {
  return cachedContext !== null;
}

/**
 * Get customData from current OpenFin context
 * Helper function to avoid code duplication
 */
async function getCustomData(): Promise<any> {
  if (!isOpenFin()) {
    return null;
  }

  try {
    // Try Window context first
    try {
      const currentWindow = fin.Window.getCurrentSync();
      const windowOptions = await currentWindow.getOptions();
      return (windowOptions as any).customData;
    } catch (windowError) {
      // Try View context
      try {
        const currentView = await fin.View.getCurrent();
        const viewOptions = await currentView.getOptions();
        return (viewOptions as any).customData;
      } catch (viewError) {
        // Try fin.me as fallback
        try {
          const options = await fin.me.getOptions();
          return (options as any).customData;
        } catch (meError) {
          return null;
        }
      }
    }
  } catch (error) {
    logger.warn('Failed to get customData from OpenFin', error, 'platformContext');
    return null;
  }
}

/**
 * Get appId from OpenFin customData
 * This is the unique identifier for the component instance
 */
export async function getAppId(): Promise<string> {
  const DEFAULT_APP_ID = 'stern-platform';

  if (!isOpenFin()) {
    return DEFAULT_APP_ID;
  }

  try {
    const customData = await getCustomData();

    // Return appId from customData
    if (customData?.appId) {
      return customData.appId;
    }

    // Try to construct from current entity name
    try {
      const currentWindow = fin.Window.getCurrentSync();
      const options = await currentWindow.getOptions();
      return options.name || DEFAULT_APP_ID;
    } catch {
      try {
        const currentView = await fin.View.getCurrent();
        const options = await currentView.getOptions();
        return options.name || DEFAULT_APP_ID;
      } catch {
        return DEFAULT_APP_ID;
      }
    }
  } catch (error) {
    logger.warn('Failed to get appId from OpenFin', error, 'platformContext');
    return DEFAULT_APP_ID;
  }
}

/**
 * Get userId from OpenFin customData
 * This identifies the user for configuration management
 */
export async function getUserId(): Promise<string> {
  const DEFAULT_USER_ID = 'default-user';

  if (!isOpenFin()) {
    return DEFAULT_USER_ID;
  }

  try {
    const customData = await getCustomData();

    // Return userId from customData
    if (customData?.userId) {
      return customData.userId;
    }

    // Try to get from platform context
    const context = await getPlatformContext();
    if (context.userId) {
      return context.userId;
    }

    return DEFAULT_USER_ID;
  } catch (error) {
    logger.warn('Failed to get userId from OpenFin', error, 'platformContext');
    return DEFAULT_USER_ID;
  }
}

/**
 * Get viewInstanceId from OpenFin customData
 * This is a fallback method - the primary method is reading from URL via getViewInstanceId() in viewUtils.ts
 *
 * The viewInstanceId identifies a specific instance of a view/component and is used
 * for configuration persistence across workspace save/restore cycles.
 *
 * @returns viewInstanceId from customData, or null if not found
 */
export async function getViewInstanceIdFromCustomData(): Promise<string | null> {
  if (!isOpenFin()) {
    return null;
  }

  try {
    const customData = await getCustomData();

    if (customData?.viewInstanceId) {
      logger.debug('Got viewInstanceId from customData', { viewInstanceId: customData.viewInstanceId }, 'platformContext');
      return customData.viewInstanceId;
    }

    return null;
  } catch (error) {
    logger.warn('Failed to get viewInstanceId from OpenFin customData', error, 'platformContext');
    return null;
  }
}
