import React, { useEffect, useState } from 'react';
import { init, CustomActionCallerType } from '@openfin/workspace-platform';
import { Dock, Home, Storefront, type App } from '@openfin/workspace';
import * as Notifications from '@openfin/workspace/notifications';
import { register as registerDock } from './dock';
import { register as registerHome } from './home';
import { register as registerStore } from './store';
import { register as registerNotifications } from './notifications';
import { launchApp } from './launch';
import { THEME_PALETTES } from './theme-palettes';
import themeService from './theme-service';
import type { CustomSettings, PlatformSettings } from './shapes';

let isInitialized = false;
let logMessage: React.Dispatch<React.SetStateAction<string>>;

function Provider() {
  const [message, setMessage] = useState("");

  logMessage = setMessage;

  useEffect(() => {
    (async function () {
      if (!isInitialized) {
        isInitialized = true;
        try {
          setMessage("Stern Trading Platform initializing...");

          // Load the settings from the manifest
          const settings = await getManifestCustomSettings();

          // When the platform api is ready we bootstrap the workspace components
          const platform = fin.Platform.getCurrentSync();
          await platform.once("platform-api-ready", async () => {
            await initializeWorkspaceComponents(settings.platformSettings, settings.customSettings);
            setMessage("Workspace platform initialized successfully");
          });

          // CRITICAL: Initialize the workspace platform FIRST
          // This will trigger the platform-api-ready event
          await initializeWorkspacePlatform(settings.platformSettings);
        } catch (err) {
          const errorMessage = `Error Initializing Platform: ${err instanceof Error ? err.message : err}`;
          setMessage(errorMessage);
          console.error(errorMessage, err);
        }
      }
    })();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-400">Stern Trading Platform</h1>
          <p className="text-slate-400 mt-2">OpenFin Workspace Platform Provider</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">Provider Window</div>
        </div>
      </header>
      <main className="flex-1 flex flex-col justify-center items-center">
        <div className="text-center max-w-lg">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p className="text-lg mb-4">{message}</p>
          <div className="text-sm text-slate-400 space-y-2">
            <p>This window initializes the OpenFin workspace platform.</p>
            <p>It will remain hidden during normal operation.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Initialize the workspace platform.
 */
async function initializeWorkspacePlatform(platformSettings: PlatformSettings): Promise<void> {
  logMessage("Initializing workspace platform...");

  await init({
    browser: {
      defaultWindowOptions: {
        icon: platformSettings.icon,
        workspacePlatform: {
          pages: [],
          favicon: platformSettings.icon
        }
      }
    },
    theme: [
      {
        label: "Stern Trading Theme",
        default: "light",
        palette: {
          light: THEME_PALETTES.light,
          dark: THEME_PALETTES.dark
        }
      }
    ],
    customActions: {
      "launch-app": async (e): Promise<void> => {
        if (
          e.callerType === CustomActionCallerType.CustomButton ||
          e.callerType === CustomActionCallerType.CustomDropdownItem
        ) {
          await launchApp(e.customData as App);
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
            logMessage("Theme set to light mode");
            console.log("[THEME_TOGGLE] Light theme action completed successfully");
          } catch (error) {
            const errorMessage = `Failed to set light theme: ${error instanceof Error ? error.message : error}`;
            logMessage(errorMessage);
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
            logMessage("Theme set to dark mode");
            console.log("[THEME_TOGGLE] Dark theme action completed successfully");
          } catch (error) {
            const errorMessage = `Failed to set dark theme: ${error instanceof Error ? error.message : error}`;
            logMessage(errorMessage);
            console.error("[THEME_TOGGLE] Dark theme action failed:", errorMessage, error);
          }
        } else {
          console.warn("[THEME_TOGGLE] Invalid caller type for dark theme action, received:", e.callerType);
        }
      }
    }
  });

  logMessage("Workspace platform initialized");
}

/**
 * Initialize workspace components (Home, Dock, Store, Notifications).
 */
async function initializeWorkspaceComponents(
  platformSettings: PlatformSettings,
  customSettings?: CustomSettings
): Promise<void> {
  logMessage("Initializing the workspace components");

  try {
    // Register with home and show it
    logMessage("Initializing the workspace components: home");
    await registerHome(platformSettings, customSettings?.apps);
    await Home.show();
  } catch (error) {
    console.error("Error initializing home component:", error);
    logMessage(`Error initializing home component: ${error instanceof Error ? error.message : error}`);
  }

  try {
    // Register with store
    logMessage("Initializing the workspace components: store");
    await registerStore(platformSettings, customSettings?.apps);
  } catch (error) {
    console.error("Error initializing store component:", error);
    logMessage(`Error initializing store component: ${error instanceof Error ? error.message : error}`);
  }

  try {
    // Register with dock
    logMessage("Initializing the workspace components: dock");
    await registerDock(platformSettings, customSettings?.apps);
    await Dock.show();
  } catch (error) {
    console.error("Error initializing dock component:", error);
    logMessage(`Error initializing dock component: ${error instanceof Error ? error.message : error}`);
  }

  try {
    // Register with notifications
    logMessage("Initializing the workspace components: notifications");
    await registerNotifications(platformSettings);
  } catch (error) {
    console.error("Error initializing notifications component:", error);
    logMessage(`Error initializing notifications component: ${error instanceof Error ? error.message : error}`);
  }

  // Create the main application window as a workspace browser window (supports theming)
  try {
    logMessage("Creating main application window...");
    const platform = fin.Platform.getCurrentSync();
    await platform.createView({
      url: 'http://localhost:5173/',
      name: 'stern-main-view'
    }, {
      name: 'stern-main-window',
      defaultLeft: 100,
      defaultTop: 100,
      defaultWidth: 1200,
      defaultHeight: 800,
      minWidth: 800,
      minHeight: 600,
      defaultCentered: true,
      saveWindowState: true,
      icon: platformSettings.icon,
      workspacePlatform: {
        pages: [{
          title: 'Stern Trading Platform',
          favicon: platformSettings.icon
        }],
        favicon: platformSettings.icon,
        toolbarOptions: {
          buttons: []
        }
      }
    });
    logMessage("Main workspace window created successfully");
  } catch (error) {
    console.error("Error creating main window:", error);
    logMessage(`Error creating main window: ${error instanceof Error ? error.message : error}`);
  }

  // Initialize theme service after all components are ready
  try {
    logMessage("Initializing theme service...");
    await themeService.initialize();
    logMessage("Theme service initialized successfully");
  } catch (error) {
    console.error("Error initializing theme service:", error);
    logMessage(`Error initializing theme service: ${error instanceof Error ? error.message : error}`);
  }

  // When the platform requests to be close we deregister from workspace components and quit
  const providerWindow = fin.Window.getCurrentSync();
  await providerWindow.once("close-requested", async () => {
    try {
      await Home.deregister(platformSettings.id);
      await Storefront.deregister(platformSettings.id);
      await Dock.deregister();
      await Notifications.deregister(platformSettings.id);
      await fin.Platform.getCurrentSync().quit();
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  });
}

/**
 * Read the custom settings from the manifest.
 */
async function getManifestCustomSettings(): Promise<{
  platformSettings: PlatformSettings;
  customSettings?: CustomSettings;
}> {
  // Get the manifest for the current application
  const app = await fin.Application.getCurrent();
  const manifest: any = await app.getManifest();

  return {
    platformSettings: {
      id: manifest.platform?.uuid ?? "stern-trading-platform",
      title: manifest.shortcut?.name ?? "Stern Trading Platform",
      icon: manifest.platform?.icon ?? "http://localhost:5173/favicon.ico"
    },
    customSettings: manifest.customSettings
  };
}

export default Provider;