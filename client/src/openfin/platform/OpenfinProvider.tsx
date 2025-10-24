import { useState, useEffect, useRef } from 'react';
import { init } from '@openfin/workspace-platform';
import { OpenFinWorkspaceProvider } from '../services/OpenfinWorkspaceProvider';
import { useOpenfinTheme } from '../hooks/useOpenfinTheme';
import { TopTabBar } from '@/components/provider/TopTabBar';
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

      // Platform icon: Use SVG for windows (provider, apps) - works fine with SVG
      // Note: Dock provider taskbar icon requires PNG/ICO - handled in openfinDock.ts
      // star.svg (2.5KB) works for regular windows, dock will auto-convert to star.png
      const iconUrl = manifest.platform?.icon || buildUrl("/star.svg");
      logger.info(`[DOCK_ICON] Platform icon URL: "${iconUrl}"`, undefined, 'Provider');

      return {
        platformSettings: {
          id: manifest.platform?.uuid || "stern-platform",
          title: manifest.shortcut?.name || "Stern Trading Platform",
          icon: iconUrl
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
          icon: buildUrl("/star.svg")  // SVG for windows (dock converts to PNG automatically)
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
              logger.info('Loading DockApplicationsMenuItems configuration from API...', undefined, 'Provider');
              const userId = 'default-user'; // TODO: Get from auth service
              const menuItemsConfig = await dockConfigService.loadApplicationsMenuItems(userId);

              if (menuItemsConfig && menuItemsConfig.config?.menuItems && menuItemsConfig.config.menuItems.length > 0) {
                // User has saved menu items in the database - use those
                logger.info('✅ Loaded DockApplicationsMenuItems config from database', {
                  configId: menuItemsConfig.configId,
                  name: menuItemsConfig.name,
                  menuItemsCount: menuItemsConfig.config.menuItems.length
                }, 'Provider');
                logger.info('📋 Using menu items configured via Dock Configuration screen', undefined, 'Provider');

                // Convert DockApplicationsMenuItemsConfig to DockConfiguration for backwards compatibility
                const dockConfig = {
                  ...menuItemsConfig,
                  componentType: 'dock' as const,
                  componentSubType: 'default' as const
                };

                // Register dock with saved configuration (suppress analytics errors)
                try {
                  await dock.registerFromConfig(dockConfig, settings.platformSettings.icon);
                  logger.info('Dock registered with user-configured menu items', undefined, 'Provider');
                } catch (dockError: any) {
                  if (dockError?.message?.includes('system topic payload')) {
                    logger.warn('Dock registered successfully (analytics error suppressed)', undefined, 'Provider');
                  } else {
                    throw dockError;
                  }
                }
              } else {
                logger.info('No DockApplicationsMenuItems configuration found in database', undefined, 'Provider');
                logger.info('Fallback: Using apps from manifest.customSettings.apps', undefined, 'Provider');

                // Convert manifest apps to dock menu items
                const appsFromManifest = apps.map((app: any, index: number) => ({
                  id: app.appId || `app-${index}`,
                  caption: app.title || app.name,
                  url: app.url || app.manifest,
                  icon: app.icons?.[0]?.src || buildUrl('/icons/app.svg'),
                  openMode: (app.manifestType === 'view' ? 'view' : 'window') as 'window' | 'view',
                  order: index,
                  windowOptions: {
                    autoShow: true,
                    defaultWidth: 1200,
                    defaultHeight: 800
                  }
                }));

                logger.info('Converted manifest apps to menu items', {
                  appsCount: apps.length,
                  menuItems: appsFromManifest
                }, 'Provider');

                // Register dock with manifest apps as menu items
                try {
                  await dock.register({
                    id: settings.platformSettings.id,
                    title: settings.platformSettings.title,
                    icon: settings.platformSettings.icon,
                    menuItems: appsFromManifest
                  });
                  logger.info('Dock registered with manifest apps', {
                    menuItemsCount: appsFromManifest.length
                  }, 'Provider');
                } catch (dockError: any) {
                  if (dockError?.message?.includes('system topic payload')) {
                    logger.warn('Dock registered successfully (analytics error suppressed)', undefined, 'Provider');
                  } else {
                    throw dockError;
                  }
                }
              }
            } catch (apiError) {
              logger.warn('Failed to load dock config from API, using manifest apps as fallback', apiError, 'Provider');

              // Fallback to manifest apps
              const appsFromManifest = apps.map((app: any, index: number) => ({
                id: app.appId || `app-${index}`,
                caption: app.title || app.name,
                url: app.url || app.manifest,
                icon: app.icons?.[0]?.src || buildUrl('/icons/app.svg'),
                openMode: (app.manifestType === 'view' ? 'view' : 'window') as 'window' | 'view',
                order: index,
                windowOptions: {
                  autoShow: true,
                  defaultWidth: 1200,
                  defaultHeight: 800
                }
              }));

              try {
                await dock.register({
                  id: settings.platformSettings.id,
                  title: settings.platformSettings.title,
                  icon: settings.platformSettings.icon,
                  menuItems: appsFromManifest
                });
                logger.info('Dock registered with manifest apps (API error fallback)', {
                  menuItemsCount: appsFromManifest.length
                }, 'Provider');
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

    // Debug logging for theme state
    useEffect(() => {
      logger.info('[PROVIDER WINDOW] Theme state changed', {
        theme,
        resolvedTheme,
        htmlClassName: document.documentElement.className,
        htmlHasDark: document.documentElement.classList.contains('dark'),
        bodyClassName: document.body.className,
      }, 'DashboardContent');
    }, [theme, resolvedTheme]);

    // Log on mount
    useEffect(() => {
      logger.info('[PROVIDER WINDOW] DashboardContent mounted', {
        isOpenFin: typeof window !== 'undefined' && !!window.fin,
        currentTheme: theme,
        resolvedTheme: resolvedTheme,
      }, 'DashboardContent');
    }, []);

    return (
      <div className="flex flex-col h-screen bg-background text-foreground p-2.5">
        <TopTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
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

  // Note: ThemeProvider is NOT needed here because the provider window route
  // is already wrapped by ThemeProvider in main.tsx (lines 25-30)
  // Having nested ThemeProviders prevents theme synchronization from working
  return (
    <OpenFinWorkspaceProvider>
      <DashboardContent />
      <Toaster />
    </OpenFinWorkspaceProvider>
  );
}