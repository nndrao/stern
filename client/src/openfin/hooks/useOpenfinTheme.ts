/**
 * OpenFin Theme Hook
 * Synchronizes theme changes across all OpenFin windows using IAB (Inter-Application Bus)
 */

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { logger } from '@/utils/logger';

const THEME_TOPIC = 'stern-platform:theme-change';

/**
 * Hook to sync theme across all OpenFin windows
 *
 * This hook:
 * 1. Listens to theme change messages via IAB (when user changes theme from dock or any window)
 * 2. Updates the React theme provider to match
 * 3. Broadcasts theme changes to other windows
 *
 * @returns Current theme and setter function
 */
export function useOpenfinTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Log theme state changes
  useEffect(() => {
    logger.info('[THEME] React theme state updated', { theme, resolvedTheme }, 'useOpenfinTheme');
    logger.info(`[THEME] HTML element classes: ${document.documentElement.className}`, undefined, 'useOpenfinTheme');
  }, [theme, resolvedTheme]);

  // Listen for theme changes from other windows via IAB
  useEffect(() => {
    // Only run in OpenFin environment
    if (typeof window === 'undefined' || !window.fin) {
      logger.info('[THEME] Not in OpenFin environment, IAB sync disabled', undefined, 'useOpenfinTheme');
      return;
    }

    let isSubscribed = true;

    const setupIAB = async () => {
      try {
        // Subscribe to theme change messages from all windows
        const unsubscribe = await fin.InterApplicationBus.subscribe(
          { uuid: '*' }, // Listen to all apps
          THEME_TOPIC,
          (message: { theme: string }, identity) => {
            if (isSubscribed) {
              const newTheme = message.theme;
              logger.info(`[THEME] 🎨 Received theme change message: ${newTheme} from ${identity.uuid}`, undefined, 'useOpenfinTheme');

              // Update React theme
              setTheme(newTheme);
              logger.info(`[THEME] ✅ Updated theme to: ${newTheme}`, undefined, 'useOpenfinTheme');

              // Verify after a delay
              setTimeout(() => {
                const htmlElement = document.documentElement;
                const hasClass = htmlElement.classList.contains('dark');
                const expected = newTheme === 'dark';

                if (hasClass === expected) {
                  logger.info(`[THEME] ✅ Theme applied successfully: ${newTheme}`, undefined, 'useOpenfinTheme');
                } else {
                  logger.error(`[THEME] ❌ Theme mismatch! Expected: ${newTheme}, HTML has dark: ${hasClass}`, undefined, 'useOpenfinTheme');
                }
              }, 200);
            }
          }
        );

        logger.info(`[THEME] IAB subscription created for topic: ${THEME_TOPIC}`, undefined, 'useOpenfinTheme');

        // Cleanup on unmount
        return () => {
          isSubscribed = false;
          if (unsubscribe) {
            fin.InterApplicationBus.unsubscribe({ uuid: '*' }, THEME_TOPIC, unsubscribe as any);
            logger.info('[THEME] IAB subscription cleaned up', undefined, 'useOpenfinTheme');
          }
        };
      } catch (error) {
        logger.error('[THEME] Failed to setup IAB theme sync', error, 'useOpenfinTheme');
      }
    };

    setupIAB();

    return () => {
      isSubscribed = false;
    };
  }, [setTheme]); // Only re-run if setTheme changes

  // Broadcast theme changes to other windows when theme changes locally
  useEffect(() => {
    if (typeof window === 'undefined' || !window.fin || !resolvedTheme) {
      return;
    }

    const broadcastTheme = async () => {
      try {
        await fin.InterApplicationBus.publish(THEME_TOPIC, { theme: resolvedTheme });
        logger.info(`[THEME] 📢 Broadcasted theme change: ${resolvedTheme}`, undefined, 'useOpenfinTheme');
      } catch (error) {
        logger.error('[THEME] Failed to broadcast theme change', error, 'useOpenfinTheme');
      }
    };

    // Small delay to avoid broadcasting during initialization
    const timer = setTimeout(broadcastTheme, 100);
    return () => clearTimeout(timer);
  }, [resolvedTheme]);

  return { theme, setTheme, resolvedTheme };
}
