import { getCurrentSync, CustomActionCallerType } from '@openfin/workspace-platform';
import { Dock } from '@openfin/workspace';
import { buildUrl } from '../openfin-utils';
import { DockMenuItem, DockConfiguration, DockButton, DockButtonOption } from '../types/dockConfig';
import { launchMenuItem } from './menuLauncher';
import { logger } from '@/utils/logger';

/**
 * Check if Dock API is available
 */
export function isDockAvailable(): boolean {
  try {
    // Check if Dock is imported and has the required methods
    return typeof Dock !== 'undefined' &&
           typeof Dock.register === 'function' &&
           typeof Dock.show === 'function';
  } catch (error) {
    logger.error('Error checking dock availability', error, 'dock');
    return false;
  }
}

/**
 * Interface for dock configuration
 */
interface DockConfig {
  id: string;
  title: string;
  icon: string;
  apps: any[];
  menuItems?: DockMenuItem[]; // For dynamic configuration
}

// Store the current dock configuration for quick reload
let currentDockConfig: DockConfig | null = null;

/**
 * Dock custom actions for handling button clicks
 */
export function dockGetCustomActions() {
  return {
    "launch-app": async (e: any) => {
      if (e.callerType === CustomActionCallerType.CustomDropdownItem) {
        const app = e.customData;
        try {
          if (app.manifestType === "view" || app.url) {
            // Launch as a view in a new window
            const platform = getCurrentSync();
            await platform.createWindow({
              name: `${app.appId}-window-${Date.now()}`,
              url: app.url || app.manifest,
              defaultWidth: 1200,
              defaultHeight: 800,
              autoShow: true,
              frame: true,
              contextMenu: true
            });
          } else if (app.manifest) {
            // Launch as a separate application from manifest
            await fin.Application.startFromManifest(app.manifest);
          } else {
            logger.error('App configuration missing url or manifest', app, 'dock');
          }
        } catch (error) {
          logger.error('Failed to launch app', error, 'dock');
        }
      }
    },

    "launch-component": async (e: any) => {
      if (e.callerType === CustomActionCallerType.CustomDropdownItem ||
          e.callerType === CustomActionCallerType.CustomButton) {
        const menuItem = e.customData as DockMenuItem;
        try {
          await launchMenuItem(menuItem);
        } catch (error) {
          logger.error('Failed to launch component', error, 'dock');
        }
      }
    },

    "set-theme": async (e: any) => {
      if (e.callerType === CustomActionCallerType.CustomDropdownItem) {
        const theme = e.customData;
        try {
          const platform = getCurrentSync();
          await platform.Theme.setSelectedScheme(theme);
        } catch (error) {
          logger.error('Failed to set theme', error, 'dock');
        }
      }
    },

    "reload-dock": async (e: any) => {
      if (e.callerType === CustomActionCallerType.CustomDropdownItem) {
        try {
          logger.info('Quick reloading dock...', undefined, 'dock');

          // Check if we have a stored configuration
          if (!currentDockConfig) {
            logger.warn('No dock configuration stored, falling back to window reload', undefined, 'dock');
            const providerWindow = fin.Window.getCurrentSync();
            await providerWindow.reload();
            return;
          }

          // Deregister current dock
          await Dock.deregister();
          logger.info('Dock deregistered', undefined, 'dock');

          // Small delay to let cleanup happen
          await new Promise(resolve => setTimeout(resolve, 100));

          // Re-register with stored config
          await registerDock(currentDockConfig);

          // Show the dock
          await showDock();
          logger.info('Dock reloaded successfully', undefined, 'dock');
        } catch (error) {
          logger.error('Failed to reload dock', error, 'dock');
          // Fallback to window reload on error
          try {
            const providerWindow = fin.Window.getCurrentSync();
            await providerWindow.reload();
          } catch (fallbackError) {
            logger.error('Fallback reload also failed', fallbackError, 'dock');
          }
        }
      }
    },

    "show-dock-dev-tools": async (e: any) => {
      if (e.callerType === CustomActionCallerType.CustomDropdownItem) {
        try {
          // Get the dock window and show dev tools
          const dockWindows = await fin.System.getAllWindows();
          const dockWindow = dockWindows.find((w: any) =>
            w.name?.includes('dock') || w.uuid?.includes('dock')
          );
          if (dockWindow) {
            const dockWin = fin.Window.wrapSync({ uuid: dockWindow.uuid, name: dockWindow.mainWindow.name });
            await dockWin.showDeveloperTools();
          } else {
            logger.info('Dock window not found', undefined, 'dock');
          }
        } catch (error) {
          logger.error('Failed to show dock dev tools', error, 'dock');
        }
      }
    },

    "toggle-provider-window": async (e: any) => {
      if (e.callerType === CustomActionCallerType.CustomDropdownItem) {
        try {
          // Toggle the provider window visibility
          const providerWindow = fin.Window.getCurrentSync();
          const isShowing = await providerWindow.isShowing();
          if (isShowing) {
            await providerWindow.hide();
          } else {
            await providerWindow.show();
          }
        } catch (error) {
          logger.error('Failed to toggle provider window', error, 'dock');
        }
      }
    }
  };
}

/**
 * Convert menu items to dock buttons
 */
function convertMenuItemsToButtons(items: DockMenuItem[]): DockButton[] {
  return items.map(item => {
    if (item.children && item.children.length > 0) {
      // Create dropdown button for items with children
      return {
        type: "DropdownButton" as any,
        id: item.id,
        tooltip: item.caption,
        iconUrl: item.icon ? buildUrl(item.icon) : buildUrl('/icons/default.svg'),
        options: item.children.map(child => ({
          tooltip: child.caption,
          iconUrl: child.icon ? buildUrl(child.icon) : buildUrl('/icons/default.svg'),
          action: {
            id: 'launch-component',
            customData: child
          }
        }))
      };
    } else {
      // Create regular button for items without children
      return {
        type: "CustomButton" as any,
        id: item.id,
        tooltip: item.caption,
        iconUrl: item.icon ? buildUrl(item.icon) : buildUrl('/icons/default.svg'),
        action: {
          id: 'launch-component',
          customData: item
        }
      };
    }
  });
}

/**
 * Register and configure the dock with workspace
 */
export async function registerDock(config: DockConfig): Promise<void> {
  try {
    // Store the configuration for quick reload
    currentDockConfig = config;

    // Build the Applications dropdown options
    let applicationOptions: any[] = [];

    // Add configured menu items - preserve nested structure for OpenFin dock
    if (config.menuItems && config.menuItems.length > 0) {
      logger.debug('Processing menu items', { count: config.menuItems.length, items: config.menuItems }, 'dock');

      const convertToDropdownOptions = (items: DockMenuItem[]): any[] => {
        return items.map(item => {
          const option: any = {
            tooltip: item.caption,
            iconUrl: item.icon ? buildUrl(item.icon) : buildUrl('/icons/default.svg')
          };

          // If item has children, add them as nested options
          if (item.children && item.children.length > 0) {
            logger.debug('Item has children - creating submenu', { parent: item.caption, childCount: item.children.length }, 'dock');
            option.options = convertToDropdownOptions(item.children);
          } else {
            // Leaf item - add action to launch
            logger.debug('Adding leaf item', { caption: item.caption, url: item.url }, 'dock');
            option.action = {
              id: 'launch-component',
              customData: item
            };
          }

          return option;
        });
      };

      applicationOptions = convertToDropdownOptions(config.menuItems);
      logger.info('Built application options with nested structure', { count: applicationOptions.length }, 'dock');
    } else {
      logger.warn('No menu items to process', undefined, 'dock');
    }

    // Add legacy apps if present
    if (config.apps && config.apps.length > 0) {
      const appOptions = config.apps.map((app: any) => ({
        tooltip: app.title,
        iconUrl: app.icons?.[0]?.src || config.icon,
        action: { id: "launch-app", customData: app }
      }));
      applicationOptions = [...applicationOptions, ...appOptions];
    }

    // Always use the standard dock structure with Applications, Theme, and Tools
    const buttons = [
      {
        type: "DropdownButton" as any,
        id: "apps-dropdown",
        tooltip: "Applications",
        iconUrl: buildUrl("/icons/app.svg"),
        options: applicationOptions
      },
      {
        type: "DropdownButton" as any,
        id: "theme-dropdown",
        tooltip: "Theme",
        iconUrl: buildUrl("/icons/theme-switch.svg"),
        options: [
          {
            tooltip: "Light Theme",
            iconUrl: buildUrl("/icons/theme-switch.svg"),
            action: { id: "set-theme", customData: "light" }
          },
          {
            tooltip: "Dark Theme",
            iconUrl: buildUrl("/icons/theme-switch.svg"),
            action: { id: "set-theme", customData: "dark" }
          }
        ]
      },
      {
        type: "DropdownButton" as any,
        id: "tools-dropdown",
        tooltip: "Tools",
        iconUrl: buildUrl("/icons/tools.svg"),
        options: [
          {
            tooltip: "Reload Dock",
            iconUrl: buildUrl("/icons/reload.svg"),
            action: { id: "reload-dock" }
          },
          {
            tooltip: "Show Dock Developer Tools",
            iconUrl: buildUrl("/icons/dev-tools.svg"),
            action: { id: "show-dock-dev-tools" }
          },
          {
            tooltip: "Toggle Provider Window",
            iconUrl: buildUrl("/icons/provider-window.svg"),
            action: { id: "toggle-provider-window" }
          }
        ]
      }
    ];

    // Register the dock with the configured buttons
    try {
      await Dock.register({
        id: config.id + "-dock",
        title: config.title,
        icon: config.icon,
        buttons: buttons
      });
    } catch (registerError: unknown) {
      // If dock is already registered, deregister and re-register
      if (registerError instanceof Error && registerError.message?.includes('already registered')) {
        logger.info('Dock already registered, re-registering...', undefined, 'dock');
        await Dock.deregister();
        await Dock.register({
          id: config.id + "-dock",
          title: config.title,
          icon: config.icon,
          buttons: buttons
        });
      } else {
        throw registerError;
      }
    }

    logger.info('Dock registered successfully', undefined, 'dock');
  } catch (error) {
    logger.error('Failed to register dock', error, 'dock');
    throw error;
  }
}

/**
 * Register dock from a DockConfiguration object
 */
export async function registerDockFromConfig(config: DockConfiguration): Promise<void> {
  const dockConfig: DockConfig = {
    id: config.configId,
    title: config.name,
    icon: buildUrl('/icons/dock.svg'),
    apps: [],
    menuItems: config.config.menuItems
  };

  await registerDock(dockConfig);
}

/**
 * Show the dock after registration
 */
export async function showDock(): Promise<void> {
  try {
    await Dock.show();
    logger.info('Dock shown successfully', undefined, 'dock');
  } catch (error) {
    logger.error('Failed to show dock', error, 'dock');
    throw error;
  }
}

/**
 * Deregister the dock (cleanup)
 */
export async function deregisterDock(): Promise<void> {
  try {
    await Dock.deregister();
    logger.info('Dock deregistered successfully', undefined, 'dock');
  } catch (error) {
    logger.error('Failed to deregister dock', error, 'dock');
    throw error;
  }
}