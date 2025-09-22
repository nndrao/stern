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
      // For now, just update the React theme - OpenFin workspace theming
      // is handled in the platform initialization
      setTheme(newTheme);
      console.log('[THEME_SYNC] Theme updated to:', newTheme);
    } catch (error) {
      console.error('[THEME_SYNC] Failed to update theme:', error);
      setTheme(newTheme);
    }
  };

  return {
    theme,
    setTheme: setWorkspaceTheme,
    isOpenFin: typeof fin !== 'undefined'
  };
}