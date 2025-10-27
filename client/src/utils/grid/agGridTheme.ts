/**
 * AG Grid Theme Configuration
 * Generic theme setup for all AG Grid instances in the application
 */

import { themeQuartz } from 'ag-grid-community';

/**
 * Stern platform AG Grid theme with light and dark mode support
 * Based on AGV3 implementation pattern
 */
export const sternAgGridTheme = themeQuartz
  // Light mode configuration
  .withParams(
    {
      backgroundColor: "#E4E4E4",
      browserColorScheme: "light",
      headerFontSize: 14
  },
    'light'
  )
  // Dark mode configuration
  .withParams(
    {
      backgroundColor: "#2B2B2C",
      browserColorScheme: "dark",
      chromeBackgroundColor: {
          ref: "foregroundColor",
          mix: 0.07,
          onto: "backgroundColor"
      },
      foregroundColor: "#FFF",
      headerFontSize: 14
  },
    'dark'
  );

/**
 * Sets the AG Grid theme mode on the document body
 * This should be called whenever the application theme changes
 *
 * @param isDark - Whether dark mode is enabled
 */
export function setAgGridThemeMode(isDark: boolean) {
  document.body.dataset.agThemeMode = isDark ? 'dark' : 'light';
}

/**
 * Gets the current AG Grid theme mode from the document body
 *
 * @returns 'dark' | 'light'
 */
export function getAgGridThemeMode(): 'dark' | 'light' {
  return document.body.dataset.agThemeMode === 'dark' ? 'dark' : 'light';
}
