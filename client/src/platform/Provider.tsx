import { useEffect, useRef } from 'react';
import { init } from '@openfin/workspace-platform';
import { Dock, Home, Storefront, CLITemplate } from '@openfin/workspace';
import * as Notifications from '@openfin/workspace/notifications';
import { dockGetCustomActions } from './dock';

export default function Provider() {
  const isInitialized = useRef(false);

  useEffect(() => {
    // Check if we're in OpenFin environment and prevent double initialization
    if (typeof window !== 'undefined' && window.fin && !isInitialized.current) {
      isInitialized.current = true;
      initializePlatform();
    } else if (!window.fin) {
      console.log('Not in OpenFin environment - Provider will not initialize');
    }
  }, []);

  async function getManifestCustomSettings() {
    try {
      // Get the current OpenFin application
      const app = await fin.Application.getCurrent();

      // Get the manifest - using the correct API
      const manifest = await app.getManifest() as any;

      return {
        platformSettings: {
          id: manifest.platform?.uuid || "stern-platform",
          title: manifest.shortcut?.name || "Stern Trading Platform",
          icon: manifest.platform?.icon || "http://localhost:5173/stern.svg"
        },
        customSettings: manifest.customSettings || { apps: [] }
      };
    } catch (error) {
      console.error('Failed to get manifest settings:', error);
      // Return defaults if manifest loading fails
      return {
        platformSettings: {
          id: "stern-platform",
          title: "Stern Trading Platform",
          icon: "http://localhost:5173/stern.svg"
        },
        customSettings: { apps: [] }
      };
    }
  }

  async function launchApp(app: any) {
    console.log('Launching app:', app);
    if (app.manifestType === "view" || app.url) {
      // Launch as a view in the current platform
      const platform = fin.Platform.getCurrentSync();
      const view = await platform.createView({
        name: app.appId,
        url: app.url || app.manifest,
        target: { name: app.appId, uuid: fin.me.uuid }
      });

      // Create a window to host the view
      const window = await platform.createWindow({
        name: `${app.appId}-window`,
        defaultWidth: 1200,
        defaultHeight: 800,
        layout: {
          content: [
            {
              type: "component",
              componentName: "view",
              componentState: {
                name: app.appId,
                url: app.url || app.manifest
              }
            }
          ]
        }
      });
    } else if (app.manifest) {
      // Launch as a separate application from manifest
      await fin.Application.startFromManifest(app.manifest);
    } else {
      console.error('App configuration missing url or manifest:', app);
    }
  }

  function appToSearchEntry(app: any) {
    return {
      key: app.appId,
      title: app.title,
      description: app.description || '',
      data: app,
      label: 'App',
      template: CLITemplate.SimpleText,
      actions: [
        {
          name: "Launch",
          hotkey: "Enter"
        }
      ],
      icon: app.icons?.[0]?.src
    };
  }

  async function initializePlatform() {
    try {
      console.log('Starting OpenFin platform initialization...');

      // Get settings from manifest
      const settings = await getManifestCustomSettings();
      const apps = settings.customSettings.apps || [];

      console.log('Platform settings:', settings.platformSettings);
      console.log('Apps to register:', apps);

      // FIRST: Initialize the workspace platform
      console.log('Initializing workspace platform...');
      await init({
        browser: {
          defaultWindowOptions: {
            icon: settings.platformSettings.icon,
            workspacePlatform: {
              pages: [],
              favicon: settings.platformSettings.icon
            }
          }
        },
        theme: [{
          label: "Default",
          default: "light",
          palettes: {
            light: {
              brandPrimary: "#0A76D3",
              brandSecondary: "#1E1F23",
              backgroundPrimary: "#FAFBFE",
              background1: "#FFFFFF",
              background2: "#FAFBFE",
              background3: "#F3F5F8",
              background4: "#ECEEF1",
              background5: "#DDDFE4",
              background6: "#C9CBD2",
              statusSuccess: "#35C759",
              statusWarning: "#F48F00",
              statusCritical: "#BE1700",
              statusActive: "#0498FB",
              inputBackground: "#ECEEF1",
              inputColor: "#1E1F23",
              inputPlaceholder: "#6D7178",
              inputDisabled: "#7D808A",
              inputFocused: "#C9CBD2",
              textDefault: "#1E1F23",
              textHelp: "#2F3136",
              textInactive: "#7D808A"
            },
            dark: {
              brandPrimary: "#0A76D3",
              brandSecondary: "#383A47",
              backgroundPrimary: "#1E1F23",
              background1: "#111214",
              background2: "#2F3136",
              background3: "#383A47",
              background4: "#4B4C58",
              background5: "#5E606A",
              background6: "#71747C",
              statusSuccess: "#35C759",
              statusWarning: "#F48F00",
              statusCritical: "#BE1700",
              statusActive: "#0498FB",
              inputBackground: "#53555F",
              inputColor: "#FFFFFF",
              inputPlaceholder: "#C9CBD2",
              inputDisabled: "#7D808A",
              inputFocused: "#71747C",
              textDefault: "#FFFFFF",
              textHelp: "#C9CBD2",
              textInactive: "#7D808A"
            }
          }
        }],
        customActions: dockGetCustomActions()
      });

      console.log('Platform initialized, waiting for platform-api-ready...');

      // Get the current platform
      const platform = fin.Platform.getCurrentSync();

      // THEN: Register components when platform API is ready
      await platform.once("platform-api-ready", async () => {
        console.log('Platform API ready - registering workspace components');

        try {
          // Register all workspace components
          await Promise.all([
            // Register Dock
            Dock.register({
              id: settings.platformSettings.id + "-dock",
              title: settings.platformSettings.title,
              icon: settings.platformSettings.icon,
              buttons: [
                {
                  type: "DropdownButton" as any,
                  id: "apps-dropdown",
                  tooltip: "Applications",
                  iconUrl: settings.platformSettings.icon,
                  options: apps.map((app: any) => ({
                    tooltip: app.title,
                    iconUrl: app.icons?.[0]?.src || settings.platformSettings.icon,
                    action: { id: "launch-app", customData: app }
                  }))
                },
                {
                  type: "DropdownButton" as any,
                  id: "theme-dropdown",
                  tooltip: "Theme",
                  iconUrl: settings.platformSettings.icon,
                  options: [
                    {
                      tooltip: "Light Theme",
                      iconUrl: settings.platformSettings.icon,
                      action: { id: "set-theme", customData: "light" }
                    },
                    {
                      tooltip: "Dark Theme",
                      iconUrl: settings.platformSettings.icon,
                      action: { id: "set-theme", customData: "dark" }
                    }
                  ]
                }
              ]
            }),

            // Register Home with proper search implementation
            Home.register({
              title: settings.platformSettings.title,
              id: settings.platformSettings.id + "-home",
              icon: settings.platformSettings.icon,
              onUserInput: async (request: any, response: any) => {
                // Don't search for commands
                if (request.query && request.query.startsWith("/")) {
                  return [];
                }

                // Filter apps based on search query
                const query = request.query?.toLowerCase() || "";
                const filteredApps = apps.filter((app: any) => {
                  const title = app.title?.toLowerCase() || "";
                  const description = app.description?.toLowerCase() || "";
                  return title.includes(query) || description.includes(query);
                });

                // Return search results
                return {
                  results: filteredApps.map(appToSearchEntry)
                };
              },
              onResultDispatch: async (result: any) => {
                // Launch the selected app
                if (result.data) {
                  await launchApp(result.data);
                }
              }
            }),

            // Register Store
            Storefront.register({
              id: settings.platformSettings.id + "-store",
              title: "App Store",
              icon: settings.platformSettings.icon,
              landingPage: {
                hero: {
                  title: settings.platformSettings.title,
                  description: "Unified configurable trading platform",
                  cta: { title: "Learn More", id: "learn-more" }
                }
              },
              getApps: async () => apps,
              launchApp: async (app: any) => {
                await launchApp(app);
              }
            }),

            // Register Notifications
            Notifications.register({
              id: settings.platformSettings.id + "-notifications",
              title: "Notifications",
              icon: settings.platformSettings.icon
            })
          ]);

          console.log('Workspace components registered successfully');

          // Show dock and home after registration
          await Dock.show();
          await Home.show();

          // Hide provider window after initialization
          const providerWindow = fin.Window.getCurrentSync();
          await providerWindow.hide();

        } catch (error) {
          console.error('Failed to register workspace components:', error);
        }
      });

      console.log('Platform initialization complete');
    } catch (error) {
      console.error('Failed to initialize platform:', error);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Stern Trading Platform</h1>
        <p>Provider Window - Initializing workspace...</p>
        <p className="text-sm mt-4 text-slate-400">This window will be hidden once initialized</p>
      </div>
    </div>
  );
}