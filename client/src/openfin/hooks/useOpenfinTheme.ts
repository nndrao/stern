/**
 * OpenFin Theme Hook
 * Listens to theme changes from OpenFin Dock and applies them to React components
 *
 * IMPORTANT: This hook ONLY listens to theme changes - it NEVER broadcasts changes.
 * Theme control is one-way: Dock → Components (never Components → Dock)
 *
 * This is a specialized hook built on top of useOpenFinEvents for theme management.
 */

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useOpenFinEvents } from './useOpenFinEvents';
import { OpenFinCustomEvents } from '../types/openfinEvents';
import { logger } from '@/utils/logger';

/**
 * Hook to receive theme changes from OpenFin Dock
 *
 * This hook:
 * 1. Listens to theme change messages via IAB (when user changes theme from dock)
 * 2. Updates the React theme provider to match the dock's theme
 * 3. Syncs initial theme from OpenFin platform on mount
 *
 * NOTE: Components using this hook will ONLY listen and apply themes.
 * They will NEVER broadcast theme changes back to avoid circular updates.
 *
 * @returns Current theme and setter function
 */
export function useOpenfinTheme() {
  logger.info('[useOpenfinTheme] Hook called', undefined, 'useOpenfinTheme');

  const { theme, setTheme, resolvedTheme } = useTheme();
  logger.info('[useOpenfinTheme] useTheme() returned', { theme, resolvedTheme }, 'useOpenfinTheme');

  const { on, platform } = useOpenFinEvents();
  logger.info('[useOpenfinTheme] useOpenFinEvents() returned', {
    isOpenFin: platform.isOpenFin,
    hasOn: typeof on === 'function',
    hasPlatform: !!platform
  }, 'useOpenfinTheme');

  // Listen for theme change events from dock via IAB
  useEffect(() => {
    logger.info('[useOpenfinTheme] Setting up theme change listener', {
      event: OpenFinCustomEvents.THEME_CHANGE,
      isOpenFin: platform.isOpenFin
    }, 'useOpenfinTheme');

    // Subscribe to theme change events using the lightweight event wrapper
    const unsubscribe = on(OpenFinCustomEvents.THEME_CHANGE, (data) => {
      logger.info(`[useOpenfinTheme] ✅ Received theme change event: ${data.theme}`, undefined, 'useOpenfinTheme');

      // Update React theme to match
      setTheme(data.theme);
      logger.info(`[useOpenfinTheme] Called setTheme(${data.theme})`, undefined, 'useOpenfinTheme');

      // Verify after a delay
      setTimeout(() => {
        const htmlElement = document.documentElement;
        const hasClass = htmlElement.classList.contains('dark');
        const expected = data.theme === 'dark';

        if (hasClass !== expected) {
          logger.error(
            `[useOpenfinTheme] ❌ Theme mismatch! Expected: ${data.theme}, HTML has dark: ${hasClass}`,
            undefined,
            'useOpenfinTheme'
          );
        } else {
          logger.info(`[useOpenfinTheme] ✅ Theme verified successfully: ${data.theme}`, undefined, 'useOpenfinTheme');
        }
      }, 200);
    });

    logger.info('[useOpenfinTheme] Theme listener setup complete, unsubscribe function created', undefined, 'useOpenfinTheme');

    return unsubscribe;
  }, [on, setTheme]);

  // Get initial platform theme on mount (sync React with OpenFin)
  useEffect(() => {
    if (!platform.isOpenFin) {
      logger.debug('Not in OpenFin, skipping initial theme sync', undefined, 'useOpenfinTheme');
      return;
    }

    const syncInitialTheme = async () => {
      try {
        const { getCurrentSync } = await import('@openfin/workspace-platform');
        const platformInstance = getCurrentSync();
        const currentScheme = await platformInstance.Theme.getSelectedScheme();

        if (currentScheme && (currentScheme === 'light' || currentScheme === 'dark')) {
          logger.info(`Initial platform theme: ${currentScheme}`, undefined, 'useOpenfinTheme');
          setTheme(currentScheme);
          logger.info(`Synced React theme to platform: ${currentScheme}`, undefined, 'useOpenfinTheme');
        }
      } catch (error) {
        logger.warn('Could not get initial platform theme, using default', error, 'useOpenfinTheme');
      }
    };

    syncInitialTheme();
  }, [platform.isOpenFin, setTheme]);

  return { theme, setTheme, resolvedTheme };
}
