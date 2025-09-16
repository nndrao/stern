import type { CustomPaletteSet } from '@openfin/workspace-platform';

/**
 * Light and dark theme palettes for the Stern Trading Platform
 * Based on OpenFin workspace default palettes with custom branding
 */
export const THEME_PALETTES: Record<string, CustomPaletteSet> = {
  light: {
    brandPrimary: '#0066CC', // Stern brand primary from manifest
    brandSecondary: '#004499', // Stern brand secondary from manifest
    backgroundPrimary: '#FAFBFE',
    background1: '#FFFFFF',
    background2: '#F9FAFB',
    background3: '#F3F4F6',
    background4: '#E5E7EB',
    background5: '#D1D5DB',
    background6: '#9CA3AF',
    statusSuccess: '#10B981',
    statusWarning: '#F59E0B',
    statusCritical: '#EF4444',
    statusActive: '#3B82F6',
    inputBackground: '#FFFFFF',
    inputColor: '#111827',
    inputPlaceholder: '#6B7280',
    inputDisabled: '#F3F4F6',
    inputFocused: '#3B82F6',
    textDefault: '#111827',
    textHelp: '#6B7280',
    textInactive: '#9CA3AF',
    linkDefault: '#3B82F6',
    linkHover: '#2563EB',
    // Chrome/Window specific colors
    chromeBase: '#FFFFFF',
    chromeBorder: '#E5E7EB',
    chromeText: '#111827',
    chromeButtonBase: '#F9FAFB',
    chromeButtonHover: '#F3F4F6'
  },
  dark: {
    brandPrimary: '#0066CC', // Stern brand primary from manifest
    brandSecondary: '#004499', // Stern brand secondary from manifest
    backgroundPrimary: '#1e293b', // From manifest backgroundPrimary
    background1: '#1e293b',
    background2: '#334155',
    background3: '#475569',
    background4: '#64748b',
    background5: '#94a3b8',
    background6: '#cbd5e1',
    statusSuccess: '#10B981',
    statusWarning: '#F59E0B',
    statusCritical: '#EF4444',
    statusActive: '#3B82F6',
    inputBackground: '#374151',
    inputColor: '#F9FAFB',
    inputPlaceholder: '#9CA3AF',
    inputDisabled: '#1F2937',
    inputFocused: '#3B82F6',
    textDefault: '#F9FAFB',
    textHelp: '#D1D5DB',
    textInactive: '#6B7280',
    linkDefault: '#60A5FA',
    linkHover: '#93C5FD',
    // Chrome/Window specific colors for dark mode
    chromeBase: '#1e293b',
    chromeBorder: '#475569',
    chromeText: '#F9FAFB',
    chromeButtonBase: '#334155',
    chromeButtonHover: '#475569'
  }
};

/**
 * Default theme mode - start with light mode to show moon icon initially
 */
export const DEFAULT_THEME_MODE = 'light';

/**
 * Available theme modes
 */
export const THEME_MODES = ['light', 'dark'] as const;

export type ThemeMode = typeof THEME_MODES[number];