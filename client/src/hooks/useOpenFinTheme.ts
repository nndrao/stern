import { useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * Hook that synchronizes React app theme with OpenFin workspace platform theme
 * Listens for workspace theme events and updates the React theme accordingly
 */
export function useOpenFinTheme() {
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    // Only run in OpenFin environment
    if (typeof fin === 'undefined') {
      return;
    }

    let isSubscribed = true;

    const initThemeSync = async () => {
      try {
        // Get the current workspace platform
        const { getCurrentSync } = await import('@openfin/workspace-platform');
        const workspacePlatform = getCurrentSync();

        if (workspacePlatform?.Theme) {
          // Get initial theme state
          try {
            const currentScheme = await workspacePlatform.Theme.getSelectedScheme();
            console.log('[THEME_SYNC] Initial workspace theme:', currentScheme);

            // Sync React theme with workspace theme
            if (isSubscribed && currentScheme && (currentScheme === 'light' || currentScheme === 'dark')) {
              setTheme(currentScheme);
            }
          } catch (error) {
            console.warn('[THEME_SYNC] Could not get initial theme:', error);
          }

          // Listen for theme changes from workspace
          const handleThemeChange = (event: any) => {
            console.log('[THEME_SYNC] Workspace theme changed:', event);
            if (isSubscribed && event.schemeType && (event.schemeType === 'light' || event.schemeType === 'dark')) {
              setTheme(event.schemeType);
            }
          };

          // Subscribe to theme change events
          try {
            workspacePlatform.Theme.on('theme-changed', handleThemeChange);
            console.log('[THEME_SYNC] Theme sync initialized successfully');

            // Cleanup function
            return () => {
              isSubscribed = false;
              try {
                workspacePlatform.Theme.off('theme-changed', handleThemeChange);
                console.log('[THEME_SYNC] Theme sync cleanup completed');
              } catch (error) {
                console.warn('[THEME_SYNC] Error during cleanup:', error);
              }
            };
          } catch (error) {
            console.warn('[THEME_SYNC] Could not subscribe to theme events:', error);
          }
        } else {
          console.warn('[THEME_SYNC] Workspace platform Theme API not available');
        }
      } catch (error) {
        console.warn('[THEME_SYNC] Failed to initialize theme sync:', error);
      }
    };

    const cleanup = initThemeSync();

    // Return cleanup function
    return () => {
      isSubscribed = false;
      if (cleanup instanceof Promise) {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      } else if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [setTheme]);

  // Also expose a function to manually trigger workspace theme change from React
  const setWorkspaceTheme = async (newTheme: 'light' | 'dark') => {
    if (typeof fin === 'undefined') {
      console.warn('[THEME_SYNC] OpenFin not available, updating React theme only');
      setTheme(newTheme);
      return;
    }

    try {
      const { getCurrentSync } = await import('@openfin/workspace-platform');
      const workspacePlatform = getCurrentSync();

      if (workspacePlatform?.Theme) {
        await workspacePlatform.Theme.setSelectedScheme(newTheme);
        console.log('[THEME_SYNC] Workspace theme updated to:', newTheme);
        // React theme will be updated via the event listener
      } else {
        console.warn('[THEME_SYNC] Workspace platform not available, updating React theme only');
        setTheme(newTheme);
      }
    } catch (error) {
      console.error('[THEME_SYNC] Failed to update workspace theme:', error);
      // Fallback to updating React theme only
      setTheme(newTheme);
    }
  };

  return {
    theme,
    setTheme: setWorkspaceTheme,
    isOpenFin: typeof fin !== 'undefined'
  };
}