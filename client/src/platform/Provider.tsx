import { useState, useEffect, useRef } from 'react';
import { init } from '@openfin/workspace-platform';
import { ThemeProvider } from '@/components/theme-provider';
import { OpenFinWorkspaceProvider } from '@/services/openfin/OpenFinWorkspaceProvider';
import { Sidebar } from '@/components/provider/Sidebar';
import { DockConfigEditor } from '@/components/provider/DockConfigEditor';
import { Toaster } from '@/components/ui/toaster';
import { dockGetCustomActions, registerDock, showDock, isDockAvailable, registerDockFromConfig } from './dock';
import { initializeBaseUrlFromManifest, buildUrl } from '../openfin-utils';
import { logger } from '@/utils/logger';
import { dockConfigService } from '@/services/dockConfigService';

// Placeholder components for future features
const SettingsPanel = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h2 className="text-2xl font-semibold mb-2">Settings</h2>
      <p className="text-muted-foreground">Settings panel coming soon</p>
    </div>
  </div>
);

const HelpPanel = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h2 className="text-2xl font-semibold mb-2">Help & Documentation</h2>
      <p className="text-muted-foreground">Help documentation coming soon</p>
    </div>
  </div>
);

export default function Provider() {
  const isInitialized = useRef(false);
  const [isPlatformReady, setIsPlatformReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dock');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Check if we're in OpenFin environment and prevent double initialization
    if (typeof window !== 'undefined' && window.fin && !isInitialized.current) {
      isInitialized.current = true;
      initializePlatform();
    } else if (!window.fin) {
      logger.info('Not in OpenFin environment - Provider will not initialize', undefined, 'Provider');
      // Still show the UI in non-OpenFin environment for development
      setIsPlatformReady(true);
    }
  }, []);

  async function getManifestCustomSettings() {
    try {
      // Get the current OpenFin application
      const app = await fin.Application.getCurrent();

      // Get the manifest - using the correct API
      const manifest = await app.getManifest() as any;

      // Initialize base URL from manifest if available
      await initializeBaseUrlFromManifest();

      return {
        platformSettings: {
          id: manifest.platform?.uuid || "stern-platform",
          title: manifest.shortcut?.name || "Stern Trading Platform",
          icon: manifest.platform?.icon || buildUrl("/stern.svg")
        },
        customSettings: manifest.customSettings || { apps: [] }
      };
    } catch (error) {
      logger.error('Failed to get manifest settings', error, 'Provider');
      // Return defaults if manifest loading fails
      return {
        platformSettings: {
          id: "stern-platform",
          title: "Stern Trading Platform",
          icon: buildUrl("/stern.svg")
        },
        customSettings: { apps: [] }
      };
    }
  }


  async function initializePlatform() {
    try {
      logger.info('Starting OpenFin platform initialization...', undefined, 'Provider');

      // Get settings from manifest
      const settings = await getManifestCustomSettings();
      const apps = settings.customSettings.apps || [];

      logger.info('Platform settings:', settings.platformSettings, 'Provider');
      logger.debug('Apps to register:', apps, 'Provider');

      // FIRST: Initialize the workspace platform
      logger.info('Initializing workspace platform...', undefined, 'Provider');

      // Wrap in try-catch to handle initialization errors
      try {
        // Minimal initialization to avoid registration errors
        await init({
          browser: {},
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

      logger.info('Platform initialized, waiting for platform-api-ready...', undefined, 'Provider');
    } catch (initError: any) {
      logger.error('Failed to initialize workspace platform', initError, 'Provider');
      // Continue anyway - the UI should still work
      if (initError?.message?.includes('system topic payload')) {
        logger.info('Skipping workspace platform features due to initialization error', undefined, 'Provider');
      }
    }

      // Get the current platform
      try {
        const platform = fin.Platform.getCurrentSync();

        // THEN: Register components when platform API is ready
        platform.once("platform-api-ready", async () => {
        logger.info('Platform API ready - registering workspace components', undefined, 'Provider');

        try {
          // Add a small delay to ensure workspace APIs are fully initialized
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if Dock is available
          if (isDockAvailable()) {
            // Try to load saved dock configuration from API
            try {
              logger.info('Loading saved dock configuration from API...', undefined, 'Provider');
              const userId = 'default-user'; // TODO: Get from auth service
              const configs = await dockConfigService.loadByUser(userId);

              if (configs && configs.length > 0) {
                // Use the first configuration (or the default one)
                const defaultConfig = configs.find(c => c.isDefault) || configs[0];
                logger.info('Loaded dock config from API', {
                  configId: defaultConfig.configId,
                  name: defaultConfig.name,
                  menuItemsCount: defaultConfig.config?.menuItems?.length
                }, 'Provider');
                logger.debug('Full config menuItems', defaultConfig.config?.menuItems, 'Provider');

                // Register dock with saved configuration
                await registerDockFromConfig(defaultConfig);
                logger.info('Dock registered with saved configuration', undefined, 'Provider');
              } else {
                logger.info('No saved dock configuration found, using manifest apps', undefined, 'Provider');
                // Fallback to manifest apps
                await registerDock({
                  id: settings.platformSettings.id,
                  title: settings.platformSettings.title,
                  icon: settings.platformSettings.icon,
                  apps: apps
                });
                logger.info('Dock registered with manifest apps', undefined, 'Provider');
              }
            } catch (apiError) {
              logger.warn('Failed to load dock config from API, falling back to manifest', apiError, 'Provider');
              // Fallback to manifest apps
              await registerDock({
                id: settings.platformSettings.id,
                title: settings.platformSettings.title,
                icon: settings.platformSettings.icon,
                apps: apps
              });
            }

            // Show dock after registration
            await showDock();
          } else {
            logger.warn('Dock API not available - skipping dock registration', undefined, 'Provider');
            logger.info('Make sure @openfin/workspace package is properly installed', undefined, 'Provider');
          }

          // Hide provider window after initialization
          const providerWindow = fin.Window.getCurrentSync();
          await providerWindow.hide();

        } catch (error: any) {
          logger.error('Failed to register workspace components', error, 'Provider');
          // Continue execution even if dock registration fails
          if (error?.message && !error.message.includes('system topic payload')) {
           // Detailed error already logged above
          }
        }
      });
    } catch (platformError: any) {
      logger.error('Failed to get platform or register listeners', platformError, 'Provider');
    }

      logger.info('Platform initialization complete', undefined, 'Provider');
      setIsPlatformReady(true);
    } catch (error) {
      logger.error('Failed to initialize platform', error, 'Provider');
      // Still show UI on error
      setIsPlatformReady(true);
    }
  }

  // Render the dashboard UI
  if (!isPlatformReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h1 className="text-2xl font-bold mb-4 mt-4">Stern Trading Platform</h1>
          <p>Initializing workspace...</p>
        </div>
      </div>
    );
  }

  // Main dashboard layout
  const DashboardContent = () => (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <main className="flex-1 overflow-hidden">
        {activeTab === 'dock' && <DockConfigEditor />}
        {activeTab === 'settings' && <SettingsPanel />}
        {activeTab === 'help' && <HelpPanel />}
      </main>
    </div>
  );

  return (
    <ThemeProvider defaultTheme="dark" storageKey="stern-theme">
      <OpenFinWorkspaceProvider>
        <DashboardContent />
        <Toaster />
      </OpenFinWorkspaceProvider>
    </ThemeProvider>
  );
}