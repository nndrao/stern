import { getCurrentSync } from '@openfin/workspace-platform';
import { CustomActionCallerType } from "@openfin/workspace-platform";
import { Dock } from '@openfin/workspace';
import { buildUrl } from '../openfin-utils';

/**
 * Interface for dock configuration
 */
interface DockConfig {
  id: string;
  title: string;
  icon: string;
  apps: any[];
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
            console.error('App configuration missing url or manifest:', app);
          }
        } catch (error) {
          console.error('Failed to launch app:', error);
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
          console.error('Failed to set theme:', error);
        }
      }
    },

    "reload-dock": async (e: any) => {
      if (e.callerType === CustomActionCallerType.CustomDropdownItem) {
        try {
          console.log('Quick reloading dock...');

          // Check if we have a stored configuration
          if (!currentDockConfig) {
            console.warn('No dock configuration stored, falling back to window reload');
            const providerWindow = fin.Window.getCurrentSync();
            await providerWindow.reload();
            return;
          }

          // Deregister current dock
          await Dock.deregister();
          console.log('Dock deregistered');

          // Small delay to let cleanup happen
          await new Promise(resolve => setTimeout(resolve, 100));

          // Re-register with stored config
          await registerDock(currentDockConfig);

          // Show the dock
          await showDock();
          console.log('Dock reloaded successfully');
        } catch (error) {
          console.error('Failed to reload dock:', error);
          // Fallback to window reload on error
          try {
            const providerWindow = fin.Window.getCurrentSync();
            await providerWindow.reload();
          } catch (fallbackError) {
            console.error('Fallback reload also failed:', fallbackError);
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
            console.log('Dock window not found');
          }
        } catch (error) {
          console.error('Failed to show dock dev tools:', error);
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
          console.error('Failed to toggle provider window:', error);
        }
      }
    }
  };
}

/**
 * Register and configure the dock with workspace
 */
export async function registerDock(config: DockConfig): Promise<void> {
  try {
    // Store the configuration for quick reload
    currentDockConfig = config;

    await Dock.register({
      id: config.id + "-dock",
      title: config.title,
      icon: config.icon,
      buttons: [
        {
          type: "DropdownButton" as any,
          id: "apps-dropdown",
          tooltip: "Applications",
          iconUrl: buildUrl("/icons/app.svg"),
          options: config.apps.map((app: any) => ({
            tooltip: app.title,
            iconUrl: app.icons?.[0]?.src || config.icon,
            action: { id: "launch-app", customData: app }
          }))
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
      ]
    });

    console.log('Dock registered successfully');
  } catch (error) {
    console.error('Failed to register dock:', error);
    throw error;
  }
}

/**
 * Show the dock after registration
 */
export async function showDock(): Promise<void> {
  try {
    await Dock.show();
    console.log('Dock shown successfully');
  } catch (error) {
    console.error('Failed to show dock:', error);
    throw error;
  }
}

/**
 * Deregister the dock (cleanup)
 */
export async function deregisterDock(): Promise<void> {
  try {
    await Dock.deregister();
    console.log('Dock deregistered successfully');
  } catch (error) {
    console.error('Failed to deregister dock:', error);
    throw error;
  }
}