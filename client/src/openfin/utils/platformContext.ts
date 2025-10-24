/**
 * Platform Context Utility
 *
 * Reads configuration from OpenFin manifest's platform.context object.
 * Provides access to environment-specific settings like API URLs.
 *
 * Example manifest structure:
 * {
 *   "platform": {
 *     "uuid": "stern-platform",
 *     "context": {
 *       "apiUrl": "http://localhost:3001",
 *       "environment": "local"
 *     }
 *   }
 * }
 */

import { logger } from '@/utils/logger';

/**
 * Platform context structure from manifest
 */
export interface PlatformContext {
  apiUrl?: string;
  environment?: string;
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
    // Get current platform
    const platform = await fin.Platform.getCurrent();

    // Get platform context
    const context = await platform.getContext();

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
