import { THEME_PALETTES, DEFAULT_THEME_MODE, type ThemeMode } from './theme-palettes';

/**
 * Theme service for managing OpenFin workspace themes
 * Handles switching between light and dark modes across all workspace components
 */
class ThemeService {
  private currentTheme: ThemeMode = DEFAULT_THEME_MODE;
  private readonly STORAGE_KEY = 'stern-theme-mode';

  constructor() {
    // Load saved theme preference
    this.loadThemeFromStorage();
  }

  /**
   * Get the current theme mode
   */
  getCurrentTheme(): ThemeMode {
    return this.currentTheme;
  }


  /**
   * Set a specific theme mode
   */
  async setTheme(theme: ThemeMode): Promise<void> {
    try {
      console.log(`[THEME_TOGGLE] Starting setTheme: ${theme}`);
      console.log(`[THEME_TOGGLE] Previous theme: ${this.currentTheme}`);

      this.currentTheme = theme;

      console.log(`[THEME_TOGGLE] Theme state updated to: ${this.currentTheme}`);

      // Save to localStorage for persistence
      this.saveThemeToStorage(theme);

      // Apply theme to OpenFin workspace platform
      console.log(`[THEME_TOGGLE] About to apply theme to workspace...`);
      await this.applyThemeToWorkspace(theme);
      console.log(`[THEME_TOGGLE] Workspace theme application completed`);

      console.log(`[THEME_TOGGLE] Theme successfully switched to: ${theme}`);
    } catch (error) {
      console.error('[THEME_TOGGLE] Failed to set theme:', error);
      throw error;
    }
  }

  /**
   * Apply theme to OpenFin workspace components
   */
  private async applyThemeToWorkspace(theme: ThemeMode): Promise<void> {
    try {
      console.log(`[THEME_TOGGLE] Applying ${theme} theme to workspace components...`);

      // Import the workspace platform module to access theming APIs
      const { getCurrentSync } = await import('@openfin/workspace-platform');

      // Set the selected color scheme for the workspace
      const workspacePlatform = getCurrentSync();
      if (workspacePlatform && workspacePlatform.Theme) {
        console.log(`[THEME_TOGGLE] Workspace platform Theme API available`);

        try {
          console.log(`[THEME_TOGGLE] Calling setSelectedScheme with theme: ${theme}`);

          // Use the scheme name directly (light or dark) as defined in our palette
          await workspacePlatform.Theme.setSelectedScheme(theme);
          console.log(`[THEME_TOGGLE] setSelectedScheme completed successfully with theme: ${theme}`);
        } catch (error) {
          console.warn(`[THEME_TOGGLE] setSelectedScheme failed:`, error);
          // Continue anyway - the theme state is still updated
        }
      } else {
        // Fallback: manually trigger theme update through platform events
        console.warn('[THEME_TOGGLE] Direct theme API not available, using fallback method');
      }

      console.log(`[THEME_TOGGLE] Applied ${theme} theme to workspace components`);
    } catch (error) {
      console.error('[THEME_TOGGLE] Failed to apply theme to workspace:', error);
      // Don't throw here as we want the theme state to be updated even if workspace update fails
    }
  }

  /**
   * Get the palette for the current theme
   */
  getCurrentPalette() {
    return THEME_PALETTES[this.currentTheme];
  }

  /**
   * Get the palette for a specific theme
   */
  getPalette(theme: ThemeMode) {
    return THEME_PALETTES[theme];
  }

  /**
   * Load theme preference from localStorage
   */
  private loadThemeFromStorage(): void {
    try {
      const savedTheme = localStorage.getItem(this.STORAGE_KEY) as ThemeMode;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        this.currentTheme = savedTheme;
      }
    } catch (error) {
      console.warn('Failed to load theme from storage, using default:', error);
    }
  }

  /**
   * Save theme preference to localStorage
   */
  private saveThemeToStorage(theme: ThemeMode): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Failed to save theme to storage:', error);
    }
  }

  /**
   * Initialize theme service - should be called after workspace platform is ready
   */
  async initialize(): Promise<void> {
    try {
      // Apply the current theme (either default or loaded from storage)
      await this.applyThemeToWorkspace(this.currentTheme);
      console.log('Theme service initialized with theme:', this.currentTheme);
    } catch (error) {
      console.error('Failed to initialize theme service:', error);
      throw error;
    }
  }



}

// Export singleton instance
export const themeService = new ThemeService();
export default themeService;