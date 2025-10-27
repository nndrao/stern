/**
 * AG Grid Theme Hook
 * Syncs AG Grid theme with the application theme
 */

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { setAgGridThemeMode } from '@/utils/grid/agGridTheme';

/**
 * Hook to sync AG Grid theme with the application theme
 * Call this hook in any component that uses AG Grid
 */
export function useAgGridTheme() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Sync AG Grid theme mode with the application theme
    const isDark = resolvedTheme === 'dark';
    setAgGridThemeMode(isDark);
  }, [resolvedTheme]);
}
