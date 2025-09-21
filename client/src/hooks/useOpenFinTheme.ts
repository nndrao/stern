import { useTheme } from 'next-themes';

/**
 * Hook that provides theme synchronization with OpenFin workspace
 * Simplified version that focuses on manual theme switching
 */
export function useOpenFinTheme() {
  const { setTheme, theme } = useTheme();

  // Function to manually set workspace theme from React
  const setWorkspaceTheme = async (newTheme: 'light' | 'dark') => {
    if (typeof fin === 'undefined') {
      console.warn('[THEME_SYNC] OpenFin not available, updating React theme only');
      setTheme(newTheme);
      return;
    }

    try {
      // Use the theme service for consistent theme switching
      const themeService = await import('../platform/theme-service');
      await themeService.default.setTheme(newTheme);
      console.log('[THEME_SYNC] Workspace theme updated to:', newTheme);

      // Also update React theme
      setTheme(newTheme);
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