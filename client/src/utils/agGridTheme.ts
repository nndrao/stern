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
      accentColor: '#3b82f6',
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      browserColorScheme: 'light',
      cellTextColor: '#000000',
      columnBorder: true,
      fontFamily: {
        googleFont: 'Inter',
      },
      fontSize: 12,
      headerBackgroundColor: '#f9fafb',
      headerFontFamily: {
        googleFont: 'Inter',
      },
      headerFontSize: 12,
      headerFontWeight: 500,
      headerTextColor: '#374151',
      oddRowBackgroundColor: '#f9fafb',
      rowHeight: 36,
      headerHeight: 36,
      cellHorizontalPadding: 8,
      spacing: 6,
    },
    'light'
  )
  // Dark mode configuration
  .withParams(
    {
      accentColor: '#3b82f6',
      backgroundColor: '#0a0a0a',
      borderColor: '#27272a',
      browserColorScheme: 'dark',
      cellTextColor: '#ffffff',
      columnBorder: true,
      fontFamily: {
        googleFont: 'Inter',
      },
      fontSize: 12,
      foregroundColor: '#ffffff',
      headerBackgroundColor: '#18181b',
      headerFontFamily: {
        googleFont: 'Inter',
      },
      headerFontSize: 12,
      headerFontWeight: 500,
      headerTextColor: '#e5e7eb',
      oddRowBackgroundColor: '#18181b',
      rowHeight: 36,
      headerHeight: 36,
      cellHorizontalPadding: 8,
      spacing: 6,
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
