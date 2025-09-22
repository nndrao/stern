import { Dock, DockButtonNames, type App, type RegistrationMetaInfo } from "@openfin/workspace";
import { CustomActionCallerType } from "@openfin/workspace-platform";
import type { PlatformSettings } from "./shapes";
import themeService from "./theme-service";
import { launchApp } from "./launch";

/**
 * Register the dock provider.
 * @param platformSettings The platform settings from the manifest.
 * @param apps The list of apps from the manifest.
 * @returns The registration details for dock.
 */
export async function register(
  platformSettings: PlatformSettings,
  apps?: App[]
): Promise<RegistrationMetaInfo | undefined> {
  console.log("Initializing the dock provider.");

  try {
    const metaInfo = await Dock.register({
      ...platformSettings,
      workspaceComponents: ["switchWorkspace"],
      disableUserRearrangement: true,
      buttons: [
        {
          type: "DropdownButton" as DockButtonNames.DropdownButton,
          tooltip: "Trading Apps",
          id: "stern-apps",
          iconUrl: "http://localhost:5173/icons/app.svg",
          options: (apps ?? []).map((app) => ({
            tooltip: app.title,
            iconUrl: app.icons?.length ? app.icons[0].src : "http://localhost:5173/icons/platform-icon.svg",
            action: {
              id: "launch-app",
              customData: app
            }
          }))
        },
        {
          type: "DropdownButton" as DockButtonNames.DropdownButton,
          tooltip: "Theme Settings",
          id: "theme-selector",
          iconUrl: "http://localhost:5173/icons/theme-switch.svg", // Use theme-agnostic platform icon
          options: [
            {
              tooltip: "Light Theme",
              iconUrl: "http://localhost:5173/icons/light-theme.svg",
              action: {
                id: "set-theme-light"
              }
            },
            {
              tooltip: "Dark Theme",
              iconUrl: "http://localhost:5173/icons/dark-theme.svg",
              action: {
                id: "set-theme-dark"
              }
            }
          ]
        },
        {
          type: "DropdownButton" as DockButtonNames.DropdownButton,
          tooltip: "Developer Tools",
          id: "dev-tools",
          iconUrl: "http://localhost:5173/icons/tools.svg",
          options: [
            {
              tooltip: "Reload Dock",
              iconUrl: "http://localhost:5173/icons/reload.svg",
              action: {
                id: "reload-dock"
              }
            },
            {
              tooltip: "Show Dock DevTools",
              iconUrl: "http://localhost:5173/icons/dev-tools.svg",
              action: {
                id: "show-dock-devtools"
              }
            },
            {
              tooltip: "Show Workspace DevTools",
              iconUrl: "http://localhost:5173/icons/dev-tools.svg",
              action: {
                id: "show-workspace-devtools"
              }
            },
            {
              tooltip: "Show All Windows",
              iconUrl: "http://localhost:5173/icons/provider-window.svg",
              action: {
                id: "show-all-windows"
              }
            },
            {
              tooltip: "Toggle Provider Window",
              iconUrl: "http://localhost:5173/icons/provider-window.svg",
              action: {
                id: "toggle-provider-window"
              }
            }
          ]
        }
      ]
    });
    console.log("Dock provider initialized:", metaInfo);
    return metaInfo;
  } catch (err) {
    console.error("An error was encountered while trying to register the dock provider", err);
  }
}

/**
 * Get custom actions for dock buttons.
 * Following OpenFin reference architecture pattern.
 */
export function dockGetCustomActions(): Record<string, (e: {callerType: unknown, customData?: unknown}) => Promise<void>> {
  return {
    "launch-app": async (e): Promise<void> => {
      console.log("[DOCK] Custom action 'launch-app' triggered");

      if (e.callerType === CustomActionCallerType.CustomButton ||
          e.callerType === CustomActionCallerType.CustomDropdownItem) {
        try {
          await launchApp(e.customData as App);
        } catch (error) {
          console.error("Error launching app:", error);
        }
      }
    },

    "set-theme-light": async (e): Promise<void> => {
      console.log("[THEME_TOGGLE] Custom action 'set-theme-light' triggered");
      console.log("[THEME_TOGGLE] Caller type:", e.callerType);

      if (e.callerType === CustomActionCallerType.CustomDropdownItem ||
          e.callerType === CustomActionCallerType.CustomButton) {
        try {
          console.log("[THEME_TOGGLE] Setting theme to light");
          await themeService.setTheme('light');
          console.log("[THEME_TOGGLE] Light theme action completed successfully");
        } catch (error) {
          const errorMessage = `Failed to set light theme: ${error instanceof Error ? error.message : error}`;
          console.error("[THEME_TOGGLE] Light theme action failed:", errorMessage, error);
        }
      } else {
        console.warn("[THEME_TOGGLE] Invalid caller type for light theme action, received:", e.callerType);
      }
    },

    "set-theme-dark": async (e): Promise<void> => {
      console.log("[THEME_TOGGLE] Custom action 'set-theme-dark' triggered");
      console.log("[THEME_TOGGLE] Caller type:", e.callerType);

      if (e.callerType === CustomActionCallerType.CustomDropdownItem ||
          e.callerType === CustomActionCallerType.CustomButton) {
        try {
          console.log("[THEME_TOGGLE] Setting theme to dark");
          await themeService.setTheme('dark');
          console.log("[THEME_TOGGLE] Dark theme action completed successfully");
        } catch (error) {
          const errorMessage = `Failed to set dark theme: ${error instanceof Error ? error.message : error}`;
          console.error("[THEME_TOGGLE] Dark theme action failed:", errorMessage, error);
        }
      } else {
        console.warn("[THEME_TOGGLE] Invalid caller type for dark theme action, received:", e.callerType);
      }
    },

    "reload-dock": async (e): Promise<void> => {
      console.log("[DEV_TOOLS] Custom action 'reload-dock' triggered");

      if (e.callerType === CustomActionCallerType.CustomDropdownItem ||
          e.callerType === CustomActionCallerType.CustomButton) {
        try {
          console.log("[DEV_TOOLS] Reloading dock...");

          // Get current platform settings from manifest
          const app = await fin.Application.getCurrent();
          const manifest = await app.getManifest() as {
            platform?: { uuid?: string; icon?: string };
            shortcut?: { name?: string };
            customSettings?: { apps?: unknown[] };
          };
          const platformSettings = {
            id: manifest.platform?.uuid ?? "stern-trading-platform",
            title: manifest.shortcut?.name ?? "Stern Trading Platform",
            icon: manifest.platform?.icon ?? "http://localhost:5173/stern.svg"
          };

          // Deregister dock
          await Dock.deregister();
          console.log("[DEV_TOOLS] Dock deregistered");

          // Wait a moment
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Re-register dock with same settings
          await register(platformSettings, manifest.customSettings?.apps as App[]);
          console.log("[DEV_TOOLS] Dock re-registered");

          // Show the dock
          await Dock.show();
          console.log("[DEV_TOOLS] Dock reload completed successfully");
        } catch (error) {
          const errorMessage = `Failed to reload dock: ${error instanceof Error ? error.message : error}`;
          console.error("[DEV_TOOLS] Dock reload failed:", errorMessage, error);
        }
      }
    },

    "show-dock-devtools": async (e): Promise<void> => {
      console.log("[DEV_TOOLS] Custom action 'show-dock-devtools' triggered");

      if (e.callerType === CustomActionCallerType.CustomDropdownItem ||
          e.callerType === CustomActionCallerType.CustomButton) {
        try {
          console.log("[DEV_TOOLS] Opening dock developer tools...");

          // Target the dock window specifically by its known identity
          const dockWindow = fin.Window.wrapSync({
            uuid: 'openfin-workspace',
            name: 'openfin-dock'
          });
          await dockWindow.showDeveloperTools();
          console.log("[DEV_TOOLS] Dock devtools opened for openfin-dock window");

          console.log("[DEV_TOOLS] Dock devtools action completed");
        } catch (error) {
          console.error("[DEV_TOOLS] Show dock devtools failed:", error);
        }
      }
    },

    "show-workspace-devtools": async (e): Promise<void> => {
      console.log("[DEV_TOOLS] Custom action 'show-workspace-devtools' triggered");

      if (e.callerType === CustomActionCallerType.CustomDropdownItem ||
          e.callerType === CustomActionCallerType.CustomButton) {
        try {
          console.log("[DEV_TOOLS] Opening workspace developer tools...");

          // Directly target the openfin-workspace UUID
          try {
            const workspaceWindow = fin.Window.wrapSync({
              uuid: 'openfin-workspace',
              name: 'openfin-workspace'
            });
            await workspaceWindow.showDeveloperTools();
            console.log("[DEV_TOOLS] Workspace devtools opened");
          } catch (error) {
            console.error("[DEV_TOOLS] Error opening workspace devtools:", error);
          }

          console.log("[DEV_TOOLS] Workspace devtools action completed");
        } catch (error) {
          console.error("[DEV_TOOLS] Show workspace devtools failed:", error);
        }
      }
    },

    "show-all-windows": async (e): Promise<void> => {
      console.log("[DEV_TOOLS] Custom action 'show-all-windows' triggered");

      if (e.callerType === CustomActionCallerType.CustomDropdownItem ||
          e.callerType === CustomActionCallerType.CustomButton) {
        try {
          console.log("[DEV_TOOLS] Listing all windows...");

          // Get all applications and windows
          const allApps = await fin.System.getAllApplications();
          console.log("\n=== ALL OPENFIN APPLICATIONS ===");

          for (const app of allApps) {
            console.log(`\nApplication: ${app.uuid}`);
            try {
              const appWindows = await fin.System.getAllWindows();
              for (const windowGroup of appWindows) {
                if (windowGroup.mainWindow) {
                  console.log(`  Main Window: ${windowGroup.mainWindow.name || 'unnamed'}`);
                }
                if (windowGroup.childWindows && windowGroup.childWindows.length > 0) {
                  windowGroup.childWindows.forEach((child, index) => {
                    console.log(`  Child Window ${index}: ${child.name || 'unnamed'}`);
                  });
                }
              }
            } catch (error) {
              console.log(`  Error getting windows: ${error instanceof Error ? error.message : error}`);
            }
          }

          console.log("\n=== SIMPLE WINDOW LIST ===");
          const allWindows = await fin.System.getAllWindows();
          allWindows.forEach((window, index) => {
            console.log(`Window ${index}: UUID=${window.uuid}, Name=${(window as {name?: string}).name || 'undefined'}`);
          });

          console.log("[DEV_TOOLS] All windows listed");
        } catch (error) {
          console.error("[DEV_TOOLS] Show all windows failed:", error);
        }
      }
    },

    "toggle-provider-window": async (e): Promise<void> => {
      console.log("[DEV_TOOLS] Custom action 'toggle-provider-window' triggered");

      if (e.callerType === CustomActionCallerType.CustomDropdownItem ||
          e.callerType === CustomActionCallerType.CustomButton) {
        try {
          console.log("[DEV_TOOLS] Toggling provider window visibility...");

          const providerWindow = fin.Window.getCurrentSync();
          const isShowing = await providerWindow.isShowing();

          if (isShowing) {
            await providerWindow.hide();
            console.log("[DEV_TOOLS] Provider window hidden");
          } else {
            await providerWindow.show();
            console.log("[DEV_TOOLS] Provider window shown");
          }

          console.log("[DEV_TOOLS] Provider window toggle completed");
        } catch (error) {
          console.error("[DEV_TOOLS] Toggle provider window failed:", error);
        }
      }
    }
  };
}