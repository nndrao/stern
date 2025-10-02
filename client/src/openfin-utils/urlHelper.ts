/**
 * URL Helper for OpenFin applications
 * Provides environment-agnostic URL management with base URL support
 */

import { logger } from '@/utils/logger';

// Store the explicitly set base URL
let explicitBaseUrl: string | null = null;

/**
 * API to explicitly set the base URL
 */
export const setBaseUrl = (url: string): void => {
  // Remove trailing slash for consistency
  explicitBaseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  logger.info(`Base URL explicitly set to: ${explicitBaseUrl}`, undefined, 'urlHelper');
};

/**
 * API to clear the explicit base URL (revert to auto-detection)
 */
export const clearBaseUrl = (): void => {
  explicitBaseUrl = null;
  logger.info('Base URL cleared, using auto-detection', undefined, 'urlHelper');
};

/**
 * Get current base URL with priority order:
 * 1. Explicitly set base URL
 * 2. Current window location origin
 */
export const getCurrentBaseUrl = (): string => {
  // Priority 1: Explicitly set base URL
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  // Priority 2: Current window location
  return window.location.origin;
};

/**
 * Build full URL from a path
 * @param path - Relative path or absolute URL
 * @returns Full URL
 */
export const buildUrl = (path: string): string => {
  // Handle empty path
  if (!path) {
    return getCurrentBaseUrl() + '/';
  }

  // Check for special URL schemes that should be returned as-is
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('//') ||  // Protocol-relative URLs
    path.startsWith('data:') ||  // Data URLs
    path.startsWith('blob:') ||  // Blob URLs
    path.startsWith('file:') ||  // File URLs
    path.startsWith('ftp://') ||  // FTP URLs
    path.startsWith('mailto:') ||  // Mailto links
    path.startsWith('tel:') ||  // Tel links
    path.startsWith('javascript:')  // JavaScript URLs
  ) {
    return path;
  }

  const base = getCurrentBaseUrl();
  // Remove trailing slash from base if present
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  // Ensure proper path joining
  const separator = path.startsWith('/') ? '' : '/';
  return `${normalizedBase}${separator}${path}`;
};

/**
 * Get the current base URL configuration
 */
export const getBaseUrlConfig = () => {
  return {
    explicitUrl: explicitBaseUrl,
    currentUrl: getCurrentBaseUrl(),
    isExplicit: !!explicitBaseUrl
  };
};

/**
 * Escape special regex characters in a string
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Migrate stored configurations to a new base URL
 * @param newBaseUrl - The new base URL to migrate to
 * @param oldBaseUrl - Optional old base URL, defaults to current
 */
export const migrateToNewBaseUrl = (newBaseUrl: string, oldBaseUrl?: string) => {
  const oldBase = oldBaseUrl || getCurrentBaseUrl();

  // Set the new base URL
  setBaseUrl(newBaseUrl);

  // Migrate localStorage data
  // Use localStorage.length and localStorage.key() for proper iteration
  const keysToMigrate: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      keysToMigrate.push(key);
    }
  }

  keysToMigrate.forEach(key => {
    // Migrate all keys that might contain URLs
    const data = localStorage.getItem(key);
    if (data && data.includes(oldBase)) {
      // Escape special regex characters in the old base URL
      const escapedOldBase = escapeRegex(oldBase);
      const migrated = data.replace(new RegExp(escapedOldBase, 'g'), newBaseUrl);
      localStorage.setItem(key, migrated);
    }
  });

  logger.info(`Migrated from ${oldBase} to ${newBaseUrl}`, undefined, 'urlHelper');
};

/**
 * Initialize base URL from OpenFin manifest
 */
export const initializeBaseUrlFromManifest = async (): Promise<void> => {
  if (window.fin) {
    try {
      const app = await fin.Application.getCurrent();
      const manifest = await app.getManifest() as any;

      // Check if manifest has a custom baseUrl setting
      if (manifest.customSettings?.baseUrl) {
        setBaseUrl(manifest.customSettings.baseUrl);
        logger.info('Base URL initialized from manifest', { baseUrl: manifest.customSettings.baseUrl }, 'urlHelper');
      }
    } catch (error) {
      logger.warn('Could not initialize base URL from manifest', error, 'urlHelper');
    }
  }
};