/**
 * OpenFin Cache Management Utilities
 */

import { logger } from '@/utils/logger';

/**
 * Clear OpenFin application cache
 * This clears the cache for the current application
 */
export async function clearOpenFinCache(): Promise<void> {
  try {
    if (typeof fin === 'undefined') {
      logger.warn('Not running in OpenFin, cache clear skipped', undefined, 'openfinCache');
      return;
    }

    // Get current application
    const app = await fin.Application.getCurrent();

    // Clear cache
    await app.clearCache();

    logger.info('OpenFin cache cleared successfully', undefined, 'openfinCache');
  } catch (error) {
    logger.error('Failed to clear OpenFin cache', error, 'openfinCache');
    throw error;
  }
}

/**
 * Clear cache and reload application
 */
export async function clearCacheAndReload(): Promise<void> {
  try {
    await clearOpenFinCache();

    // Wait a moment for cache clear to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Reload current window
    if (typeof fin !== 'undefined') {
      const currentWindow = await fin.Window.getCurrent();
      await currentWindow.reload();
    } else {
      // Fallback to browser reload
      window.location.reload();
    }
  } catch (error) {
    logger.error('Failed to clear cache and reload', error, 'openfinCache');
    throw error;
  }
}

/**
 * Get cache statistics (if available)
 */
export async function getCacheStats(): Promise<any> {
  try {
    if (typeof fin === 'undefined') {
      return null;
    }

    const system = fin.System;
    const info = await system.getHostSpecs();

    return {
      cpuUsage: info.cpuUsage,
      memoryUsage: info.memoryUsage,
      // Add more stats as needed
    };
  } catch (error) {
    logger.error('Failed to get cache stats', error, 'openfinCache');
    return null;
  }
}

/**
 * Clear all OpenFin runtime cache (requires manifest permission)
 * This is more aggressive and clears shared cache
 */
export async function clearAllRuntimeCache(): Promise<void> {
  try {
    if (typeof fin === 'undefined') {
      logger.warn('Not running in OpenFin, runtime cache clear skipped', undefined, 'openfinCache');
      return;
    }

    // This requires special permissions in the manifest
    const system = fin.System;

    // Clear cookies
    await system.clearCache({ cache: true });

    logger.info('OpenFin runtime cache cleared successfully', undefined, 'openfinCache');
  } catch (error) {
    logger.error('Failed to clear runtime cache', error, 'openfinCache');
    // Don't throw - this might fail due to permissions
    logger.warn('Runtime cache clear requires manifest permissions', undefined, 'openfinCache');
  }
}
