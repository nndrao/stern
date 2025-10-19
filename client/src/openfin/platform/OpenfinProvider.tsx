import { useState, useEffect, useRef } from 'react';
import { init } from '@openfin/workspace-platform';
import { OpenFinWorkspaceProvider } from '../services/OpenfinWorkspaceProvider';
import { ThemeProvider } from '@/components/theme-provider';
import { useOpenfinTheme } from '../hooks/useOpenfinTheme';
import { Sidebar } from '@/components/provider/Sidebar';
import { DockConfigEditor } from '@/components/provider/DockConfigEditor';
import { DataProviderEditor } from '@/components/provider/DataProviderEditor';
import { Toaster } from '@/components/ui/toaster';
import * as dock from './openfinDock';
import { initializeBaseUrlFromManifest, buildUrl } from '../utils/openfinUtils';
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

      // Suppress OpenFin analytics errors globally
      // These are non-fatal and occur when analytics payload format is incorrect
      const originalConsoleError = console.error;
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason?.message?.includes('system topic payload') ||
            event.reason?.message?.includes('registerUsage')) {
          logger.warn('Suppressed analytics error (non-fatal)', event.reason, 'Provider');
          event.preventDefault(); // Prevent error from showing in console
        }
      });

      // Get settings from manifest
      const settings = await getManifestCustomSettings();
      const apps = settings.customSettings.apps || [];

      logger.info('Platform settings:', settings.platformSettings, 'Provider');
      logger.debug('Apps to register:', apps, 'Provider');

      // FIRST: Initialize the workspace platform
      logger.info('Initializing workspace platform...', undefined, 'Provider');

      // Wrap in try-catch to handle initialization errors
      try {
        // Initialize following OpenFin workspace-starter patterns
        // IMPORTANT: Do NOT include analytics config - omitting it disables analytics entirely
        // Including analytics: { sendToOpenFin: false } still triggers analytics initialization
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
            palette: {
              brandPrimary: "#0A76D3",
              brandSecondary: "#1E1F23",
              backgroundPrimary: "#FAFBFE"
            }
          }],
          customActions: dock.dockGetCustomActions()
        });

        logger.info('Platform initialized, waiting for platform-api-ready...', undefined, 'Provider');
      } catch (initError: unknown) {
        const error = initError as Error;
        logger.error('Failed to initialize workspace platform', error, 'Provider');
        // Continue anyway - the UI should still work
        if (error?.message?.includes('system topic payload')) {
          logger.warn('OpenFin workspace initialization failed with usage tracking error - this is expected in some environments', undefined, 'Provider');
          logger.info('Continuing with platform initialization despite error', undefined, 'Provider');
        } else {
          // Re-throw if it's a different error
          throw error;
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
          if (dock.isDockAvailable()) {
            // Try to load saved dock configuration from API
            try {
              console.log('[DOCK_CONFIG] Step 1: Loading DockApplicationsMenuItems configuration from API...');
              logger.info('Loading DockApplicationsMenuItems configuration from API...', undefined, 'Provider');
              const userId = 'default-user'; // TODO: Get from auth service
              console.log('[DOCK_CONFIG] Step 2: Fetching singleton config for userId:', userId);
              const menuItemsConfig = await dockConfigService.loadApplicationsMenuItems(userId);
              console.log('[DOCK_CONFIG] Step 3: API returned config:', menuItemsConfig ? 'Found' : 'Not found');
              if (menuItemsConfig) {
                console.log('[DOCK_CONFIG] Step 3a: Full config response:', JSON.stringify(menuItemsConfig, null, 2));
              }

              if (menuItemsConfig && menuItemsConfig.config?.menuItems) {
                console.log('[DOCK_CONFIG] Step 4: Found singleton config:', {
                  configId: menuItemsConfig.configId,
                  name: menuItemsConfig.name,
                  componentType: menuItemsConfig.componentType,
                  componentSubType: menuItemsConfig.componentSubType,
                  menuItemsCount: menuItemsConfig.config.menuItems.length
                });
                console.log('[DOCK_CONFIG] Step 5: Menu items structure:', JSON.stringify(menuItemsConfig.config.menuItems, null, 2));

                logger.info('Loaded DockApplicationsMenuItems config', {
                  configId: menuItemsConfig.configId,
                  name: menuItemsConfig.name,
                  menuItemsCount: menuItemsConfig.config.menuItems.length
                }, 'Provider');

                // Convert DockApplicationsMenuItemsConfig to DockConfiguration for backwards compatibility
                const dockConfig = {
                  ...menuItemsConfig,
                  componentType: 'dock' as const,
                  componentSubType: 'default' as const
                };

                // Register dock with saved configuration (suppress analytics errors)
                try {
                  await dock.registerFromConfig(dockConfig);
                  logger.info('Dock registered with DockApplicationsMenuItems configuration', undefined, 'Provider');
                } catch (dockError: any) {
                  if (dockError?.message?.includes('system topic payload')) {
                    logger.warn('Dock registered successfully (analytics error suppressed)', undefined, 'Provider');
                  } else {
                    throw dockError;
                  }
                }
              } else {
                logger.info('No DockApplicationsMenuItems configuration found, using default', undefined, 'Provider');
                // Fallback to empty dock with system buttons (suppress analytics errors)
                try {
                  await dock.register({
                    id: settings.platformSettings.id,
                    title: settings.platformSettings.title,
                    icon: settings.platformSettings.icon,
                    menuItems: []
                  });
                  logger.info('Dock registered with default configuration', undefined, 'Provider');
                } catch (dockError: any) {
                  if (dockError?.message?.includes('system topic payload')) {
                    logger.warn('Dock registered successfully (analytics error suppressed)', undefined, 'Provider');
                  } else {
                    throw dockError;
                  }
                }
              }
            } catch (apiError) {
              logger.warn('Failed to load dock config from API, using default', apiError, 'Provider');
              // Fallback to empty dock (suppress analytics errors)
              try {
                await dock.register({
                  id: settings.platformSettings.id,
                  title: settings.platformSettings.title,
                  icon: settings.platformSettings.icon,
                  menuItems: []
                });
              } catch (dockError: any) {
                if (dockError?.message?.includes('system topic payload')) {
                  logger.warn('Dock registered successfully (analytics error suppressed)', undefined, 'Provider');
                } else {
                  throw dockError;
                }
              }
            }

            // Show dock after registration
            await dock.show();
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
  const DashboardContent = () => {
    // Sync OpenFin platform theme with React theme provider
    // This enables the provider window to respond to theme changes from the dock
    const { theme, resolvedTheme } = useOpenfinTheme();

    // Debug logging to verify theme state
    useEffect(() => {
      logger.info(`[PROVIDER WINDOW] Theme state changed:`, {
        theme,
        resolvedTheme,
        htmlClass: document.documentElement.className,
        bodyClass: document.body.className
      }, 'Provider');
    }, [theme, resolvedTheme]);

    return (
      <div className="flex h-screen bg-background text-foreground">
        {/* Debug banner to visually verify theme */}
        <div className="fixed top-0 right-0 z-50 bg-primary text-primary-foreground px-4 py-2 text-xs font-mono">
          Theme: {resolvedTheme || theme || 'unknown'} | HTML: {document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
        </div>

        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <main className="flex-1 overflow-hidden">
          {activeTab === 'dock' && <DockConfigEditor />}
          {activeTab === 'providers' && <DataProviderEditor />}
          {activeTab === 'settings' && <SettingsPanel />}
          {activeTab === 'help' && <HelpPanel />}
        </main>
      </div>
    );
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <OpenFinWorkspaceProvider>
        <DashboardContent />
        <Toaster />
      </OpenFinWorkspaceProvider>
    </ThemeProvider>
  );
}