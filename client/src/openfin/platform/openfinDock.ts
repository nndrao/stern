/**
 * OpenFin Dock Provider - Following workspace-starter patterns
 *
 * This module implements the OpenFin Workspace Dock following the exact patterns
 * from workspace-starter examples. All implementations are based on:
 * - workspace-starter/how-to/register-with-dock-basic
 * - workspace-starter/how-to/workspace-platform-starter
 *
 * Key Principles:
 * 1. Use Dock.register() from @openfin/workspace (not custom window management)
 * 2. Custom actions must be registered BEFORE dock registration in platform init()
 * 3. Use updateDockProviderConfig() for updates, not deregister/register
 * 4. For full reload: deregister -> wait 500ms -> register -> show
 * 5. Developer tools require searching through all windows/apps
 *
 * @module dock
 */

import {
  Dock,
  DockButtonNames,
  type DockButton,
  type DockProviderRegistration,
  type DockProviderConfig,
  type WorkspaceButtonsConfig
} from '@openfin/workspace';
import {
  CustomActionCallerType,
  getCurrentSync,
  type CustomActionPayload,
  type CustomActionsMap
} from '@openfin/workspace-platform';
import { buildUrl } from '../utils/openfinUtils';
import { DockConfiguration, DockMenuItem } from '../types/dockConfig';
import { launchMenuItem } from './openfinMenuLauncher';
import { OpenFinCustomEvents } from '../types/openfinEvents';
import { logger } from '@/utils/logger';

// ============================================================================
// Module State
// ============================================================================

/**
 * Current dock registration - stored for reload operations
 */
let registration: DockProviderRegistration | undefined;

/**
 * Current dock configuration - stored for reload operations
 */
let currentConfig: DockProviderConfig | undefined;

/**
 * Platform settings - stored during initialization
 */
let platformSettings: {
  id: string;
  title: string;
  icon: string;
} | undefined;

/**
 * Current theme state - used for dynamic theme button icon updates
 */
let currentTheme: 'light' | 'dark' = 'light';

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if Dock API is available in the current environment
 *
 * @returns True if Dock API is available
 */
export function isDockAvailable(): boolean {
  try {
    return (
      typeof Dock !== 'undefined' &&
      typeof Dock.register === 'function' &&
      typeof Dock.show === 'function'
    );
  } catch (error) {
    logger.error('Error checking dock availability', error, 'dock');
    return false;
  }
}

/**
 * Register the dock provider with OpenFin Workspace
 *
 * This follows the exact pattern from workspace-starter/register-with-dock-basic.
 * The dock is registered with custom buttons and workspace components.
 *
 * @param config - Dock configuration with platform settings and menu items
 * @returns Registration info if successful, undefined otherwise
 */
export async function register(config: {
  id: string;
  title: string;
  icon: string;
  workspaceComponents?: WorkspaceButtonsConfig;
  disableUserRearrangement?: boolean;
  menuItems?: DockMenuItem[];
}): Promise<DockProviderRegistration | undefined> {
  try {
    logger.info('Registering dock provider', { id: config.id, title: config.title }, 'dock');

    // Initialize currentTheme from platform's actual theme
    try {
      const platform = getCurrentSync();
      const schemes = await platform.Theme.getSelectedScheme();
      currentTheme = (schemes as any) === 'dark' ? 'dark' : 'light';
      logger.info('Initialized theme from platform', { currentTheme }, 'dock');
    } catch (error) {
      logger.warn('Could not read platform theme, defaulting to light', error, 'dock');
      currentTheme = 'light';
    }

    // Store platform settings for reload operations
    platformSettings = {
      id: config.id,
      title: config.title,
      icon: config.icon
    };

    // Build dock buttons
    const buttons: DockButton[] = [];

    // Add Applications dropdown with all menu items
    if (config.menuItems && config.menuItems.length > 0) {
      buttons.push(buildApplicationsButton(config.menuItems));
    }

    // Add system buttons (theme, reload, devtools, etc.)
    buttons.push(...buildSystemButtons());

    // Build dock configuration following workspace-starter patterns
    currentConfig = {
      id: config.id,
      title: config.title,
      icon: config.icon,
      workspaceComponents: config.workspaceComponents || {
        hideWorkspacesButton: false,
        hideHomeButton: true,
        hideNotificationsButton: true,
        hideStorefrontButton: true
      },
      disableUserRearrangement: config.disableUserRearrangement ?? false,
      buttons
    };

    logger.info(`[DOCK_ICON] Dock icon URL: "${currentConfig.icon}"`, undefined, 'dock');
    logger.info('[DOCK_ICON] Dock configuration before registration', {
      id: currentConfig.id,
      title: currentConfig.title,
      icon: currentConfig.icon,
      buttonCount: buttons.length
    }, 'dock');

    // Register with OpenFin
    registration = await Dock.register(currentConfig);

    logger.info('[DOCK_ICON] Dock registered successfully - OpenFin Dock.register() completed', {
      providedIcon: config.icon,
      buttonCount: buttons.length,
      registrationId: registration?.id
    }, 'dock');
    return registration;
  } catch (error) {
    logger.error('Failed to register dock', error, 'dock');
    return undefined;
  }
}

/**
 * Register dock from a DockConfiguration object (from our config service)
 *
 * @param config - Full DockConfiguration from API
 * @returns Registration info if successful
 */
export async function registerFromConfig(
  config: DockConfiguration,
  platformIcon?: string
): Promise<DockProviderRegistration | undefined> {
  // Dock provider icon MUST be PNG/ICO format (SVG doesn't work for taskbar icon)
  // However, SVG works fine for regular windows (like provider window)
  // Detect if platformIcon is SVG and use PNG fallback for dock
  const isOpenFinDefault = config.icon?.includes('cdn.openfin.co/workspace');
  const isSvgIcon = platformIcon?.endsWith('.svg');

  // Prioritize config.icon (if not OpenFin default), then use PNG fallback if platformIcon is SVG
  const finalIcon = (config.icon && !isOpenFinDefault)
    ? config.icon
    : (isSvgIcon ? buildUrl('/star.png') : (platformIcon || buildUrl('/star.png')));

  logger.info('[DOCK_ICON] registerFromConfig icon resolution:', {
    'config.icon': config.icon,
    'isOpenFinDefault': isOpenFinDefault,
    'platformIcon': platformIcon,
    'isSvgIcon': isSvgIcon,
    'pngFallback': buildUrl('/star.png'),
    'finalIcon': finalIcon,
    'note': isSvgIcon ? 'SVG detected - using PNG fallback for dock' : 'Using provided icon'
  }, 'dock');

  const registerConfig = {
    id: config.configId,
    title: config.name,
    icon: finalIcon,  // Use platform icon if available
    menuItems: config.config.menuItems,
    workspaceComponents: {
      hideWorkspacesButton: false,
      hideHomeButton: true,
      hideNotificationsButton: true,
      hideStorefrontButton: true
    },
    disableUserRearrangement: false
  };

  return register(registerConfig);
}

/**
 * Show the dock after registration
 *
 * @returns Promise that resolves when dock is shown
 */
export async function show(): Promise<void> {
  try {
    await Dock.show();
    logger.info('Dock shown', undefined, 'dock');
  } catch (error) {
    logger.error('Failed to show dock', error, 'dock');
    throw error;
  }
}

/**
 * Deregister the dock
 *
 * @returns Promise that resolves when dock is deregistered
 */
export async function deregister(): Promise<void> {
  try {
    if (registration) {
      await Dock.deregister();
      registration = undefined;
      currentConfig = undefined;
      logger.info('Dock deregistered', undefined, 'dock');
    }
  } catch (error) {
    logger.error('Failed to deregister dock', error, 'dock');
    throw error;
  }
}

/**
 * Update dock configuration dynamically
 *
 * Uses updateDockProviderConfig() which is more efficient than deregister/register.
 * This follows workspace-starter patterns for dynamic updates.
 *
 * @param config - New configuration to apply
 * @returns Promise that resolves when update is complete
 */
export async function updateConfig(config: {
  menuItems?: DockMenuItem[];
  workspaceComponents?: WorkspaceButtonsConfig;
}): Promise<void> {
  try {
    if (!registration || !currentConfig || !platformSettings) {
      throw new Error('Dock not registered - call register() first');
    }

    logger.info('Updating dock configuration', undefined, 'dock');

    // Build new buttons
    const buttons: DockButton[] = [];

    // Add Applications dropdown with all menu items
    if (config.menuItems && config.menuItems.length > 0) {
      buttons.push(buildApplicationsButton(config.menuItems));
    }

    // Add system buttons
    buttons.push(...buildSystemButtons());

    // Create new config
    const newConfig: DockProviderConfig = {
      ...currentConfig,
      buttons,
      workspaceComponents: config.workspaceComponents || currentConfig.workspaceComponents
    };

    // Update using OpenFin's updateDockProviderConfig (efficient, no deregister needed)
    await registration.updateDockProviderConfig(newConfig);

    // Store updated config
    currentConfig = newConfig;

    logger.info('Dock configuration updated', { buttonCount: buttons.length }, 'dock');
  } catch (error) {
    logger.error('Failed to update dock configuration', error, 'dock');
    throw error;
  }
}

/**
 * Update ALL dock button icons dynamically when theme changes
 * This rebuilds all buttons with theme-appropriate icons without reloading the dock
 */
async function updateAllDockIcons(): Promise<void> {
  try {
    if (!registration || !currentConfig || !platformSettings) {
      return;
    }

    logger.info(`Updating all dock icons for ${currentTheme} theme`, undefined, 'dock');

    const buttons: DockButton[] = [];
    const existingButtons = currentConfig.buttons || [];

    // Helper to check if button is a system button
    const isSystemButton = (button: DockButton): boolean => {
      const action = (button as any).action;
      const tooltip = (button as any).tooltip;
      // System buttons are: theme toggle and Tools dropdown
      return (action && action.id === 'toggle-theme') || tooltip === 'Tools';
    };

    // Preserve and rebuild non-system buttons (Applications button)
    // Applications button needs to be rebuilt to update its icon too
    for (const button of existingButtons) {
      if (!isSystemButton(button) && (button as any).tooltip === 'Applications') {
        // Skip - will rebuild with new icon below
        continue;
      } else if (!isSystemButton(button)) {
        buttons.push(button);
      }
    }

    // Rebuild Applications button with menu items from config
    // We need to extract menu items from somewhere - they should be stored
    // For now, preserve existing Applications button structure but update icon
    for (const button of existingButtons) {
      if ((button as any).tooltip === 'Applications') {
        buttons.push({
          ...button,
          iconUrl: getThemedIcon('app')
        } as DockButton);
      }
    }

    // Add updated system buttons (theme + tools)
    buttons.push(...buildSystemButtons());

    // Update config
    const newConfig: DockProviderConfig = {
      ...currentConfig,
      buttons
    };

    await registration.updateDockProviderConfig(newConfig);
    currentConfig = newConfig;

    logger.info('✅ All dock icons updated successfully', undefined, 'dock');
  } catch (error) {
    logger.error('Failed to update dock icons', error, 'dock');
  }
}

/**
 * Full dock reload (deregister and re-register)
 *
 * This follows the exact pattern from workspace-starter/register-with-dock-basic.
 * Used when updateConfig() is not sufficient (e.g., changing fundamental settings).
 *
 * Pattern: deregister -> wait 500ms -> register -> show
 *
 * @returns Promise that resolves when reload is complete
 */
export async function reload(): Promise<void> {
  try {
    if (!currentConfig || !platformSettings) {
      throw new Error('Dock not registered - cannot reload');
    }

    logger.info('Reloading dock (full deregister/register cycle)', undefined, 'dock');

    // Re-sync theme state from platform before reload
    try {
      const platform = getCurrentSync();
      const schemes = await platform.Theme.getSelectedScheme();
      currentTheme = (schemes as any) === 'dark' ? 'dark' : 'light';
      logger.info('Re-synced theme from platform before reload', { currentTheme }, 'dock');
    } catch (error) {
      logger.warn('Could not read platform theme during reload', error, 'dock');
    }

    // Store current config
    const configToRestore = { ...currentConfig };

    // Deregister
    await Dock.deregister();
    logger.debug('Dock deregistered', undefined, 'dock');

    // CRITICAL: Wait for cleanup (from workspace-starter pattern)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Re-register with same configuration
    registration = await Dock.register(configToRestore);
    logger.debug('Dock re-registered', undefined, 'dock');

    // Show the dock
    await Dock.show();
    logger.info('Dock reload complete', undefined, 'dock');
  } catch (error) {
    logger.error('Failed to reload dock', error, 'dock');
    throw error;
  }
}

// ============================================================================
// Custom Actions - MUST be registered before dock in platform init()
// ============================================================================

/**
 * Get custom actions for dock buttons
 *
 * CRITICAL: These must be registered in platform init() BEFORE dock registration.
 * This is the OpenFin pattern from workspace-starter.
 *
 * Usage in Provider.tsx:
 * ```typescript
 * await init({
 *   customActions: dockGetCustomActions(),
 *   // ... other config
 * });
 * ```
 *
 * @returns Map of custom action IDs to their handlers
 */
export function dockGetCustomActions(): CustomActionsMap {
  return {
    /**
     * Launch a component/application from dock menu item
     *
     * This handles both direct buttons and dropdown menu items.
     * The menuItem data is passed in customData.
     */
    'launch-component': async (payload: CustomActionPayload): Promise<void> => {
      // Check caller type (button or dropdown item)
      if (
        payload.callerType === CustomActionCallerType.CustomButton ||
        payload.callerType === CustomActionCallerType.CustomDropdownItem
      ) {
        const menuItem = payload.customData as DockMenuItem;
        try {
          await launchMenuItem(menuItem);
        } catch (error) {
          logger.error('Failed to launch component', error, 'dock');
        }
      }
    },

    /**
     * Reload the dock
     *
     * Uses the full deregister/register cycle as per workspace-starter pattern.
     */
    'reload-dock': async (): Promise<void> => {
      try {
        logger.info('Reload dock action triggered', undefined, 'dock');
        await reload();
      } catch (error) {
        logger.error('Failed to reload dock', error, 'dock');
      }
    },

    /**
     * Open developer tools for the dock window
     *
     * This implements the comprehensive search strategy from workspace-starter:
     * 1. Search all applications for workspace-related UUIDs
     * 2. Look for dock windows by name
     * 3. Check all windows as fallback
     * 4. Open current window devtools as last resort
     */
    'show-dock-devtools': async (): Promise<void> => {
      try {
        logger.info('Opening dock developer tools', undefined, 'dock');

        // Strategy 1: Find workspace applications
        const runningApps = await fin.System.getAllApplications();
        logger.debug('Running applications', { apps: runningApps.map((a) => a.uuid) }, 'dock');

        for (const app of runningApps) {
          // Look for workspace-related applications
          const appUuid = app.uuid.toLowerCase();
          if (
            appUuid.includes('openfin-workspace') ||
            appUuid.includes('workspace') ||
            appUuid === 'workspace-platform-starter'
          ) {
            try {
              logger.debug(`Checking workspace app: ${app.uuid}`, undefined, 'dock');
              const application = fin.Application.wrapSync({ uuid: app.uuid });
              const childWindows = await application.getChildWindows();

              // Look for dock windows
              for (const window of childWindows) {
                const windowName = window.identity.name?.toLowerCase() || '';
                if (windowName.includes('dock') || windowName.includes('workspace-dock')) {
                  await window.showDeveloperTools();
                  logger.info(`DevTools opened for dock window: ${window.identity.name}`, undefined, 'dock');
                  return;
                }
              }

              // Try main window if no dock window found
              const mainWindow = await application.getWindow();
              await mainWindow.showDeveloperTools();
              logger.info(`DevTools opened for workspace main window: ${app.uuid}`, undefined, 'dock');
              return;
            } catch (e) {
              logger.debug(`Could not open devtools for ${app.uuid}`, e, 'dock');
            }
          }
        }

        // Strategy 2: Check all windows for dock-related names
        logger.debug('Trying alternative approach - checking all windows', undefined, 'dock');
        const allWindows = await fin.System.getAllWindows();

        for (const appInfo of allWindows) {
          // Check main window
          const mainWindowName = appInfo.mainWindow?.name?.toLowerCase() || '';
          if (mainWindowName.includes('dock')) {
            try {
              const window = fin.Window.wrapSync({
                uuid: appInfo.uuid,
                name: appInfo.mainWindow.name
              });
              await window.showDeveloperTools();
              logger.info(`DevTools opened for main dock window: ${appInfo.mainWindow.name}`, undefined, 'dock');
              return;
            } catch (e) {
              logger.debug(`Failed to open devtools for ${appInfo.mainWindow.name}`, e, 'dock');
            }
          }

          // Check child windows
          if (appInfo.childWindows) {
            for (const child of appInfo.childWindows) {
              const childName = child.name?.toLowerCase() || '';
              if (childName.includes('dock')) {
                try {
                  const window = fin.Window.wrapSync({
                    uuid: appInfo.uuid,
                    name: child.name
                  });
                  await window.showDeveloperTools();
                  logger.info(`DevTools opened for child dock window: ${child.name}`, undefined, 'dock');
                  return;
                } catch (e) {
                  logger.debug(`Failed to open devtools for ${child.name}`, e, 'dock');
                }
              }
            }
          }
        }

        // Strategy 3: Final fallback - current window
        logger.warn('Could not find dock window, opening devtools for current window', undefined, 'dock');
        const currentWindow = fin.Window.getCurrentSync();
        await currentWindow.showDeveloperTools();
      } catch (error) {
        logger.error('Error opening dock developer tools', error, 'dock');
      }
    },

    /**
     * Set theme (light or dark)
     * Updates OpenFin platform theme (changes dock appearance) and broadcasts to all windows
     */
    'set-theme': async (payload: CustomActionPayload): Promise<void> => {
      logger.info('[DOCK] set-theme action triggered', {
        callerType: payload.callerType,
        customData: payload.customData
      }, 'dock');

      if (payload.callerType === CustomActionCallerType.CustomDropdownItem) {
        const theme = payload.customData as 'light' | 'dark';
        try {
          logger.info(`[DOCK] Setting platform theme to: ${theme}`, undefined, 'dock');

          // Update OpenFin's platform theme (changes dock appearance)
          // DON'T await this - it hangs for 10+ seconds in OpenFin
          // Fire and forget, let it update in the background
          import('@openfin/workspace-platform').then(({ getCurrentSync }) => {
            try {
              const platform = getCurrentSync();
              platform.Theme.setSelectedScheme(theme as any);
              logger.info(`[DOCK] Platform theme update initiated (fire-and-forget)`, undefined, 'dock');
            } catch (err) {
              logger.warn('[DOCK] Platform theme update failed (non-critical)', err, 'dock');
            }
          }).catch((err) => {
            logger.warn('[DOCK] Failed to import workspace-platform (non-critical)', err, 'dock');
          });

          // Immediately broadcast to all windows via IAB so React components can update
          // This is the primary mechanism for theme synchronization
          logger.info(`[DOCK] Broadcasting IAB event immediately...`, undefined, 'dock');

          await fin.InterApplicationBus.publish(
            OpenFinCustomEvents.THEME_CHANGE,
            { theme }
          );

          logger.info('[DOCK] ✅ IAB theme change event broadcasted successfully', {
            topic: OpenFinCustomEvents.THEME_CHANGE,
            theme
          }, 'dock');

        } catch (error) {
          logger.error('[DOCK] Failed to broadcast theme change', error, 'dock');
        }
      } else {
        logger.warn('[DOCK] set-theme called with unexpected caller type', {
          callerType: payload.callerType
        }, 'dock');
      }
    },

    /**
     * Toggle theme between light and dark
     */
    'toggle-theme': async (): Promise<void> => {
      try {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        currentTheme = newTheme;

        // Fire-and-forget platform theme update
        import('@openfin/workspace-platform').then(({ getCurrentSync }) => {
          try {
            const platform = getCurrentSync();
            platform.Theme.setSelectedScheme(newTheme as any);
          } catch (err) {
            logger.warn('[DOCK] Platform theme update failed', err, 'dock');
          }
        }).catch((err) => {
          logger.warn('[DOCK] Failed to import workspace-platform', err, 'dock');
        });

        // Broadcast IAB event immediately
        await fin.InterApplicationBus.publish(
          OpenFinCustomEvents.THEME_CHANGE,
          { theme: newTheme }
        );

        // Update all dock button icons for new theme
        await updateAllDockIcons();
      } catch (error) {
        logger.error('[DOCK] Failed to toggle theme', error, 'dock');
      }
    },

    /**
     * Toggle provider window visibility
     */
    'toggle-provider-window': async (): Promise<void> => {
      try {
        const providerWindow = fin.Window.getCurrentSync();
        const isShowing = await providerWindow.isShowing();

        if (isShowing) {
          await providerWindow.hide();
          logger.info('Provider window hidden', undefined, 'dock');
        } else {
          await providerWindow.show();
          await providerWindow.bringToFront();
          logger.info('Provider window shown', undefined, 'dock');
        }
      } catch (error) {
        logger.error('Failed to toggle provider window', error, 'dock');
      }
    }
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get themed icon path based on current theme
 * Returns different icons for light vs dark mode for better visibility
 * @param baseName - Icon base name (e.g., 'app', 'tools', 'reload')
 * @returns Full icon path with theme suffix
 */
function getThemedIcon(baseName: string): string {
  return buildUrl(`/icons/${baseName}-${currentTheme}.svg`);
}

/**
 * Build the Applications dropdown button containing all menu items
 *
 * This creates a single "Applications" dropdown button that contains all
 * configured menu items. This matches the original implementation where
 * all apps are grouped under one button.
 *
 * Menu items with children become nested submenus (OpenFin supports this).
 *
 * @param items - Array of menu items to include
 * @returns Applications dropdown button
 */
function buildApplicationsButton(items: DockMenuItem[]): DockButton {
  logger.info('🔨 Building Applications button', {
    itemCount: items.length,
    items: items.map(i => ({ caption: i.caption, hasChildren: !!i.children, childrenCount: i.children?.length || 0 }))
  }, 'dock');

  /**
   * Recursively convert menu items to dropdown options
   * This preserves the nested structure for items with children
   */
  function convertToDropdownOptions(menuItems: DockMenuItem[], level: number = 0): any[] {
    return menuItems.map((item) => {
      logger.debug(`${'  '.repeat(level)}📋 Processing menu item: ${item.caption}`, {
        hasChildren: !!item.children,
        childrenCount: item.children?.length || 0,
        level
      }, 'dock');

      const option: any = {
        tooltip: item.caption,
        iconUrl: item.icon ? buildUrl(item.icon) : getThemedIcon('default')
      };

      // If item has children, create nested options (submenu)
      if (item.children && item.children.length > 0) {
        logger.info(
          `${'  '.repeat(level)}📁 Creating submenu for "${item.caption}"`,
          { childCount: item.children.length },
          'dock'
        );
        option.options = convertToDropdownOptions(item.children, level + 1);
      } else {
        // Leaf item - add action to launch
        logger.debug(
          `${'  '.repeat(level)}📄 Creating leaf item "${item.caption}" with launch action`,
          undefined,
          'dock'
        );
        option.action = {
          id: 'launch-component',
          customData: item
        };
      }

      return option;
    });
  }

  const dropdownOptions = convertToDropdownOptions(items);
  logger.info('✅ Applications button built successfully', {
    totalTopLevelItems: items.length,
    dropdownOptionsCount: dropdownOptions.length
  }, 'dock');

  // Build the Applications dropdown button
  return {
    type: DockButtonNames.DropdownButton,
    tooltip: 'Applications',
    iconUrl: getThemedIcon('app'),
    options: dropdownOptions,
    contextMenu: {
      removeOption: false // Don't allow removing the Applications button
    }
  } as DockButton;
}

/**
 * Build the theme toggle button with dynamic themed icon
 * Icon shows the theme you can SWITCH TO (not current theme)
 */
function buildThemeButton(): DockButton {
  // Icon shows what you'll switch TO
  // Dark mode active -> show sun (will switch to light)
  // Light mode active -> show moon (will switch to dark)
  const iconBaseName = currentTheme === 'dark' ? 'sun' : 'moon';
  const iconUrl = getThemedIcon(iconBaseName);

  const tooltip = currentTheme === 'dark'
    ? 'Switch to Light Mode'
    : 'Switch to Dark Mode';

  return {
    type: DockButtonNames.CustomButton,
    tooltip,
    iconUrl,
    action: {
      id: 'toggle-theme'
    },
    contextMenu: {
      removeOption: true
    }
  } as DockButton;
}

/**
 * Build system buttons (theme, tools, etc.)
 *
 * These are standard utility buttons that appear on every dock.
 * Includes: Theme toggle button, Tools dropdown (reload, devtools, provider toggle)
 *
 * @returns Array of system dock buttons
 */
function buildSystemButtons(): DockButton[] {
  return [
    // Theme toggle button
    buildThemeButton(),

    // Tools dropdown
    {
      type: DockButtonNames.DropdownButton,
      tooltip: 'Tools',
      iconUrl: getThemedIcon('tools'),
      options: [
        {
          tooltip: 'Reload Dock',
          iconUrl: getThemedIcon('reload'),
          action: {
            id: 'reload-dock'
          }
        },
        {
          tooltip: 'Show Dock Developer Tools',
          iconUrl: getThemedIcon('dev-tools'),
          action: {
            id: 'show-dock-devtools'
          }
        },
        {
          tooltip: 'Toggle Provider Window',
          iconUrl: getThemedIcon('provider-window'),
          action: {
            id: 'toggle-provider-window'
          }
        }
      ],
      contextMenu: {
        removeOption: true
      }
    } as DockButton
  ];
}

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Re-export OpenFin types for convenience
 */
export type {
  DockButton,
  DockProviderRegistration,
  DockProviderConfig,
  WorkspaceButtonsConfig
};

/**
 * Configuration for dock registration
 */
export interface DockConfig {
  id: string;
  title: string;
  icon: string;
  workspaceComponents?: WorkspaceButtonsConfig;
  disableUserRearrangement?: boolean;
  menuItems?: DockMenuItem[];
}
