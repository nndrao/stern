import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setBaseUrl,
  clearBaseUrl,
  getCurrentBaseUrl,
  buildUrl,
  getBaseUrlConfig,
  migrateToNewBaseUrl,
  initializeBaseUrlFromManifest
} from './urlHelper';
import { logger } from '@/utils/logger';

describe('URL Helper Utilities', () => {
  beforeEach(() => {
    // Clear any set base URL before each test
    clearBaseUrl();
    localStorage.clear();
    // Reset window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:5173' },
      writable: true
    });
  });

  describe('setBaseUrl and clearBaseUrl', () => {
    it('should set explicit base URL', () => {
      setBaseUrl('https://production.example.com');
      expect(getCurrentBaseUrl()).toBe('https://production.example.com');
    });

    it('should clear explicit base URL', () => {
      setBaseUrl('https://production.example.com');
      clearBaseUrl();
      expect(getCurrentBaseUrl()).toBe('http://localhost:5173');
    });

    it('should log when setting base URL', () => {
      const loggerSpy = vi.spyOn(logger, 'info');
      setBaseUrl('https://test.com');
      expect(loggerSpy).toHaveBeenCalledWith('Base URL explicitly set to: https://test.com', undefined, 'urlHelper');
      loggerSpy.mockRestore();
    });

    it('should log when clearing base URL', () => {
      const loggerSpy = vi.spyOn(logger, 'info');
      clearBaseUrl();
      expect(loggerSpy).toHaveBeenCalledWith('Base URL cleared, using auto-detection', undefined, 'urlHelper');
      loggerSpy.mockRestore();
    });
  });

  describe('getCurrentBaseUrl', () => {
    it('should return explicit URL when set', () => {
      setBaseUrl('https://custom.example.com');
      expect(getCurrentBaseUrl()).toBe('https://custom.example.com');
    });

    it('should return window.location.origin when no explicit URL', () => {
      expect(getCurrentBaseUrl()).toBe('http://localhost:5173');
    });

    it('should prioritize explicit URL over window.location', () => {
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://different.com' },
        writable: true
      });
      setBaseUrl('https://explicit.com');
      expect(getCurrentBaseUrl()).toBe('https://explicit.com');
    });
  });

  describe('buildUrl', () => {
    it('should build URL with relative path', () => {
      setBaseUrl('https://example.com');
      expect(buildUrl('/icons/app.svg')).toBe('https://example.com/icons/app.svg');
    });

    it('should handle path without leading slash', () => {
      setBaseUrl('https://example.com');
      expect(buildUrl('icons/app.svg')).toBe('https://example.com/icons/app.svg');
    });

    it('should return absolute URL unchanged', () => {
      setBaseUrl('https://example.com');
      expect(buildUrl('https://other.com/icon.svg')).toBe('https://other.com/icon.svg');
    });

    it('should return http URL unchanged', () => {
      setBaseUrl('https://example.com');
      expect(buildUrl('http://other.com/icon.svg')).toBe('http://other.com/icon.svg');
    });

    it('should use window.location when no explicit base', () => {
      expect(buildUrl('/test.svg')).toBe('http://localhost:5173/test.svg');
    });

    it('should handle empty string path', () => {
      setBaseUrl('https://example.com');
      expect(buildUrl('')).toBe('https://example.com/');
    });
  });

  describe('getBaseUrlConfig', () => {
    it('should return config with explicit URL', () => {
      setBaseUrl('https://test.com');
      const config = getBaseUrlConfig();
      expect(config.explicitUrl).toBe('https://test.com');
      expect(config.currentUrl).toBe('https://test.com');
      expect(config.isExplicit).toBe(true);
    });

    it('should return config without explicit URL', () => {
      const config = getBaseUrlConfig();
      expect(config.explicitUrl).toBeNull();
      expect(config.currentUrl).toBe('http://localhost:5173');
      expect(config.isExplicit).toBe(false);
    });

    it('should update config after setting base URL', () => {
      let config = getBaseUrlConfig();
      expect(config.isExplicit).toBe(false);

      setBaseUrl('https://new.com');
      config = getBaseUrlConfig();
      expect(config.isExplicit).toBe(true);
      expect(config.explicitUrl).toBe('https://new.com');
    });
  });

  describe('migrateToNewBaseUrl', () => {
    it('should migrate localStorage URLs', () => {
      // Set up test data in localStorage
      localStorage.setItem('workspace_config', JSON.stringify({
        url: 'http://old.example.com/app',
        icon: 'http://old.example.com/icon.svg'
      }));

      migrateToNewBaseUrl('http://new.example.com', 'http://old.example.com');

      const migrated = JSON.parse(localStorage.getItem('workspace_config')!);
      expect(migrated.url).toBe('http://new.example.com/app');
      expect(migrated.icon).toBe('http://new.example.com/icon.svg');
    });

    it('should set new base URL after migration', () => {
      migrateToNewBaseUrl('http://new.example.com');
      expect(getCurrentBaseUrl()).toBe('http://new.example.com');
    });

    it('should use current base URL as old URL if not provided', () => {
      setBaseUrl('http://current.com');
      localStorage.setItem('config_test', 'http://current.com/resource');

      migrateToNewBaseUrl('http://new.com');

      const migrated = localStorage.getItem('config_test');
      expect(migrated).toBe('http://new.com/resource');
    });

    it('should handle multiple localStorage entries', () => {
      localStorage.setItem('workspace_1', 'http://old.com/page1');
      localStorage.setItem('config_2', 'http://old.com/page2');
      localStorage.setItem('unrelated', 'some other data');

      migrateToNewBaseUrl('http://new.com', 'http://old.com');

      expect(localStorage.getItem('workspace_1')).toBe('http://new.com/page1');
      expect(localStorage.getItem('config_2')).toBe('http://new.com/page2');
      expect(localStorage.getItem('unrelated')).toBe('some other data');
    });

    it('should log migration message', () => {
      const loggerSpy = vi.spyOn(logger, 'info');
      migrateToNewBaseUrl('http://new.com', 'http://old.com');
      expect(loggerSpy).toHaveBeenCalledWith('Migrated from http://old.com to http://new.com', undefined, 'urlHelper');
      loggerSpy.mockRestore();
    });
  });

  describe('initializeBaseUrlFromManifest', () => {
    it('should initialize from manifest baseUrl', async () => {
      // Mock fin.Application with baseUrl in customSettings
      global.fin = {
        Application: {
          getCurrent: () => ({
            getManifest: async () => ({
              customSettings: {
                baseUrl: 'https://manifest.example.com'
              }
            })
          })
        }
      } as any;

      await initializeBaseUrlFromManifest();
      expect(getCurrentBaseUrl()).toBe('https://manifest.example.com');
    });

    it('should handle missing baseUrl in manifest', async () => {
      global.fin = {
        Application: {
          getCurrent: () => ({
            getManifest: async () => ({
              customSettings: {}
            })
          })
        }
      } as any;

      await initializeBaseUrlFromManifest();
      expect(getCurrentBaseUrl()).toBe('http://localhost:5173');
    });

    it('should handle missing customSettings in manifest', async () => {
      global.fin = {
        Application: {
          getCurrent: () => ({
            getManifest: async () => ({})
          })
        }
      } as any;

      await initializeBaseUrlFromManifest();
      expect(getCurrentBaseUrl()).toBe('http://localhost:5173');
    });

    it('should handle when not in OpenFin environment', async () => {
      delete (global as any).fin;

      const consoleSpy = vi.spyOn(console, 'warn');
      await initializeBaseUrlFromManifest();

      expect(getCurrentBaseUrl()).toBe('http://localhost:5173');
      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      global.fin = {
        Application: {
          getCurrent: () => ({
            getManifest: async () => {
              throw new Error('Failed to get manifest');
            }
          })
        }
      } as any;

      const loggerSpy = vi.spyOn(logger, 'warn');
      await initializeBaseUrlFromManifest();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Could not initialize base URL from manifest',
        expect.any(Error),
        'urlHelper'
      );
      expect(getCurrentBaseUrl()).toBe('http://localhost:5173');
      loggerSpy.mockRestore();
    });

    it('should log when base URL is initialized from manifest', async () => {
      global.fin = {
        Application: {
          getCurrent: () => ({
            getManifest: async () => ({
              customSettings: {
                baseUrl: 'https://from-manifest.com'
              }
            })
          })
        }
      } as any;

      const loggerSpy = vi.spyOn(logger, 'info');
      await initializeBaseUrlFromManifest();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Base URL initialized from manifest',
        { baseUrl: 'https://from-manifest.com' },
        'urlHelper'
      );
      expect(getCurrentBaseUrl()).toBe('https://from-manifest.com');
      loggerSpy.mockRestore();
    });
  });
});