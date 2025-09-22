import { useEffect, useState } from 'react';
import { init } from '@openfin/workspace-platform';
import { Dock, Home, Storefront } from '@openfin/workspace';
import * as Notifications from '@openfin/workspace/notifications';
import { register as registerDock, dockGetCustomActions } from './dock';
import { register as registerHome } from './home';
import { register as registerStore } from './store';
import { register as registerNotifications } from './notifications';
import type { CustomSettings, PlatformSettings } from './shapes';

let isInitialized = false;

function Provider() {
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    (async function () {
      if (!isInitialized) {
        isInitialized = true;
        try {
          // Load the settings from the manifest
          const settings = await getManifestCustomSettings();

          // When the platform api is ready we bootstrap the workspace components
          const platform = fin.Platform.getCurrentSync();
          await platform.once("platform-api-ready", async () => {
            await initializeWorkspaceComponents(settings.platformSettings, settings.customSettings);
            setStatus("Ready");
          });

          // Initialize the workspace platform
          await initializeWorkspacePlatform(settings.platformSettings);
        } catch (err) {
          setStatus(`Error: ${err instanceof Error ? err.message : err}`);
          console.error("Platform initialization error:", err);
        }
      }
    })();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Stern Trading Platform</h1>
        <p className="text-slate-400">{status}</p>
      </div>
    </div>
  );
}

/**
 * Initialize the workspace platform.
 */
async function initializeWorkspacePlatform(platformSettings: PlatformSettings): Promise<void> {
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
        label: "Default",
        default: "light",
        palettes: {
          light: {
            brandPrimary: "#0F172A",
            brandSecondary: "#1E293B",
            backgroundPrimary: "#FFFFFF"
          },
          dark: {
            brandPrimary: "#1E293B",
            brandSecondary: "#334155",
            backgroundPrimary: "#0F172A"
          }
        }
      }
    ],
    customActions: {
      ...dockGetCustomActions()
    }
  });
}

/**
 * Initialize workspace components (Home, Dock, Store, Notifications).
 */
async function initializeWorkspaceComponents(
  platformSettings: PlatformSettings,
  customSettings?: CustomSettings
): Promise<void> {
  const bootstrap = customSettings?.bootstrap;

  if (bootstrap?.home) {
    await registerHome(platformSettings, customSettings?.apps);
    await Home.show();
  }

  if (bootstrap?.store) {
    await registerStore(platformSettings, customSettings?.apps);
  }

  if (bootstrap?.dock) {
    await registerDock(platformSettings, customSettings?.apps);
    await Dock.show();
  }

  if (bootstrap?.notifications) {
    await registerNotifications(platformSettings);
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
  const app = await fin.Application.getCurrent();
  const manifest = await app.getManifest() as {
    platform?: { uuid?: string; icon?: string };
    shortcut?: { name?: string };
    customSettings?: CustomSettings;
  };

  return {
    platformSettings: {
      id: manifest.platform?.uuid ?? "stern-trading-platform",
      title: manifest.shortcut?.name ?? "Stern Trading Platform",
      icon: manifest.platform?.icon ?? "http://localhost:5173/stern.png"
    },
    customSettings: manifest.customSettings
  };
}

export default Provider;