/**
 * OpenFin Workspace Service Provider
 * Provides a clean abstraction layer for OpenFin workspace services
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Dock } from '@openfin/workspace';
import { getCurrentSync } from '@openfin/workspace-platform';
import { logger } from '@/utils/logger';

/**
 * OpenFin Workspace Services Interface
 */
export interface OpenFinWorkspaceServices {
  // Dock Management
  registerDock: (config: any) => Promise<void>;
  updateDock: (config: any) => Promise<void>;
  showDock: () => Promise<void>;
  hideDock: () => Promise<void>;
  deregisterDock: () => Promise<void>;

  // Window/View Creation
  createWindow: (options: any) => Promise<any>;
  createView: (options: any) => Promise<any>;
  getCurrentWindow: () => any;
  getCurrentView: () => any;

  // Theme Services
  getCurrentTheme: () => Promise<string>;
  setTheme: (theme: string) => Promise<void>;
  subscribeToThemeChanges: (callback: (theme: string) => void) => () => void;

  // Cross-View Communication
  broadcastToAllViews: (message: any, topic?: string) => Promise<void>;
  subscribeToMessages: (topic: string, callback: (message: any) => void) => () => void;
  sendToView: (viewId: string, message: any) => Promise<void>;

  // Workspace Events
  onWorkspaceSaved: (callback: (workspace: any) => void) => () => void;
  onWorkspaceLoaded: (callback: (workspace: any) => void) => () => void;
  onViewClosed: (callback: (viewId: string) => void) => () => void;
  onViewFocused: (callback: (viewId: string) => void) => () => void;

  // View Management
  getCurrentViewInfo: () => Promise<any>;
  closeCurrentView: () => Promise<void>;
  maximizeCurrentView: () => Promise<void>;
  minimizeCurrentView: () => Promise<void>;
  renameCurrentView: (name: string) => Promise<void>;

  // Page Management
  renameCurrentPage: (name: string) => Promise<void>;
  getCurrentPage: () => Promise<any>;

  // Platform Info
  isOpenFin: boolean;
  platformVersion?: string;
}

/**
 * Mock services for non-OpenFin environments
 */
const createMockServices = (): OpenFinWorkspaceServices => ({
  // Dock Management
  registerDock: async (config: any) => {
    logger.debug('Mock: registerDock', config, 'OpenFinWorkspaceProvider');
  },
  updateDock: async (config: any) => {
    logger.debug('Mock: updateDock', config, 'OpenFinWorkspaceProvider');
  },
  showDock: async () => {
    logger.debug('Mock: showDock', undefined, 'OpenFinWorkspaceProvider');
  },
  hideDock: async () => {
    logger.debug('Mock: hideDock', undefined, 'OpenFinWorkspaceProvider');
  },
  deregisterDock: async () => {
    logger.debug('Mock: deregisterDock', undefined, 'OpenFinWorkspaceProvider');
  },

  // Window/View Creation
  createWindow: async (options: any) => {
    logger.debug('Mock: createWindow', options, 'OpenFinWorkspaceProvider');
    window.open(options.url, '_blank');
    return { id: `mock-window-${Date.now()}` };
  },
  createView: async (options: any) => {
    logger.debug('Mock: createView', options, 'OpenFinWorkspaceProvider');
    return { id: `mock-view-${Date.now()}` };
  },
  getCurrentWindow: () => window,
  getCurrentView: () => null,

  // Theme Services
  getCurrentTheme: async () => {
    return localStorage.getItem('stern-theme') || 'light';
  },
  setTheme: async (theme: string) => {
    localStorage.setItem('stern-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },
  subscribeToThemeChanges: (callback: (theme: string) => void) => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'stern-theme' && e.newValue) {
        callback(e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },

  // Cross-View Communication
  broadcastToAllViews: async (message: any, topic = 'default') => {
    logger.debug('Mock: broadcastToAllViews', { topic, message }, 'OpenFinWorkspaceProvider');
    window.postMessage({ topic, message }, '*');
  },
  subscribeToMessages: (topic: string, callback: (message: any) => void) => {
    const handler = (e: MessageEvent) => {
      if (e.data?.topic === topic) {
        callback(e.data.message);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  },
  sendToView: async (viewId: string, message: any) => {
    logger.debug('Mock: sendToView', { viewId, message }, 'OpenFinWorkspaceProvider');
  },

  // Workspace Events
  onWorkspaceSaved: (callback: (workspace: any) => void) => {
    logger.debug('Mock: onWorkspaceSaved', undefined, 'OpenFinWorkspaceProvider');
    return () => {};
  },
  onWorkspaceLoaded: (callback: (workspace: any) => void) => {
    logger.debug('Mock: onWorkspaceLoaded', undefined, 'OpenFinWorkspaceProvider');
    return () => {};
  },
  onViewClosed: (callback: (viewId: string) => void) => {
    logger.debug('Mock: onViewClosed', undefined, 'OpenFinWorkspaceProvider');
    return () => {};
  },
  onViewFocused: (callback: (viewId: string) => void) => {
    logger.debug('Mock: onViewFocused', undefined, 'OpenFinWorkspaceProvider');
    return () => {};
  },

  // View Management
  getCurrentViewInfo: async () => ({
    id: 'mock-view',
    name: 'Mock View',
    url: window.location.href
  }),
  closeCurrentView: async () => {
    window.close();
  },
  maximizeCurrentView: async () => {
    logger.debug('Mock: maximizeCurrentView', undefined, 'OpenFinWorkspaceProvider');
  },
  minimizeCurrentView: async () => {
    logger.debug('Mock: minimizeCurrentView', undefined, 'OpenFinWorkspaceProvider');
  },
  renameCurrentView: async (name: string) => {
    document.title = name;
  },

  // Page Management
  renameCurrentPage: async (name: string) => {
    logger.debug('Mock: renameCurrentPage', { name }, 'OpenFinWorkspaceProvider');
  },
  getCurrentPage: async () => ({
    id: 'mock-page',
    title: document.title
  }),

  // Platform Info
  isOpenFin: false,
  platformVersion: 'mock-1.0.0'
});

/**
 * Create OpenFin services
 */
const createOpenFinServices = (): OpenFinWorkspaceServices => {
  const platform = getCurrentSync();

  return {
    // Dock Management
    registerDock: async (config: any) => {
      await Dock.register(config);
    },
    updateDock: async (config: any) => {
      await Dock.deregister();
      await Dock.register(config);
    },
    showDock: async () => {
      await Dock.show();
    },
    hideDock: async () => {
      // Dock.hide is not available in current version
      logger.info('Hide dock not available', undefined, 'OpenFinWorkspaceProvider');
    },
    deregisterDock: async () => {
      await Dock.deregister();
    },

    // Window/View Creation
    createWindow: async (options: any) => {
      return await platform.createWindow(options);
    },
    createView: async (options: any) => {
      return await platform.createView(options);
    },
    getCurrentWindow: () => {
      return fin.Window.getCurrentSync();
    },
    getCurrentView: () => {
      try {
        return fin.View.getCurrentSync();
      } catch {
        return null;
      }
    },

    // Theme Services
    getCurrentTheme: async () => {
      const theme = await platform.Theme.getSelectedScheme();
      return theme;
    },
    setTheme: async (theme: string) => {
      await platform.Theme.setSelectedScheme(theme as any);
    },
    subscribeToThemeChanges: (callback: (theme: string) => void) => {
      const handler = (event: any) => {
        callback(event.selectedScheme);
      };
      // Theme events not available in current API version
      return () => {};
    },

    // Cross-View Communication
    broadcastToAllViews: async (message: any, topic = 'default') => {
      await fin.InterApplicationBus.publish(topic, message);
    },
    subscribeToMessages: (topic: string, callback: (message: any) => void) => {
      const subscription = fin.InterApplicationBus.subscribe({ uuid: '*' }, topic, callback);
      return () => {
        fin.InterApplicationBus.unsubscribe({ uuid: '*' }, topic, callback);
      };
    },
    sendToView: async (viewId: string, message: any) => {
      await fin.InterApplicationBus.send({ uuid: fin.me.uuid, name: viewId }, 'direct-message', message);
    },

    // Workspace Events
    onWorkspaceSaved: (callback: (workspace: any) => void) => {
      // Workspace events not directly available
      return () => {};
    },
    onWorkspaceLoaded: (callback: (workspace: any) => void) => {
      // Workspace events not directly available
      return () => {};
    },
    onViewClosed: (callback: (viewId: string) => void) => {
      // View events not directly available
      return () => {};
    },
    onViewFocused: (callback: (viewId: string) => void) => {
      const handler = (event: any) => callback(event.viewIdentity?.name);
      platform.on('view-focused' as any, handler);
      return () => {};
    },

    // View Management
    getCurrentViewInfo: async () => {
      try {
        const view = fin.View.getCurrentSync();
        const info = await view.getInfo();
        return info;
      } catch {
        return null;
      }
    },
    closeCurrentView: async () => {
      try {
        const view = fin.View.getCurrentSync();
        await (view as any).close();
      } catch {
        const window = fin.Window.getCurrentSync();
        await window.close();
      }
    },
    maximizeCurrentView: async () => {
      try {
        const view = fin.View.getCurrentSync();
        const window = await view.getCurrentWindow();
        await window.maximize();
      } catch {
        const window = fin.Window.getCurrentSync();
        await window.maximize();
      }
    },
    minimizeCurrentView: async () => {
      try {
        const view = fin.View.getCurrentSync();
        const window = await view.getCurrentWindow();
        await window.minimize();
      } catch {
        const window = fin.Window.getCurrentSync();
        await window.minimize();
      }
    },
    renameCurrentView: async (name: string) => {
      try {
        const view = fin.View.getCurrentSync();
        await (view as any).updateOptions({ name });
      } catch {
        // If not a view, update window title
        const window = fin.Window.getCurrentSync();
        await window.updateOptions({ title: name });
      }
    },

    // Page Management
    renameCurrentPage: async (name: string) => {
      // Page management not available in current API version
      logger.debug('Rename page', { name }, 'OpenFinWorkspaceProvider');
    },
    getCurrentPage: async () => {
      // Page management not available in current API version
      return null;
    },

    // Platform Info
    isOpenFin: true,
    platformVersion: (fin as any).desktop?.getVersion() || 'unknown'
  };
};

/**
 * OpenFin Workspace Context
 */
const OpenFinWorkspaceContext = createContext<OpenFinWorkspaceServices | null>(null);

/**
 * OpenFin Workspace Provider Component
 */
export const OpenFinWorkspaceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [services, setServices] = useState<OpenFinWorkspaceServices | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Check if we're in OpenFin environment
        if (typeof window !== 'undefined' && window.fin) {
          logger.info('Initializing OpenFin workspace services...', undefined, 'OpenFinWorkspaceProvider');

          // Wait for OpenFin to be ready
          // Note: fin.ready() is deprecated in newer versions
          // The workspace platform APIs should be ready when fin is available

          // Create OpenFin services
          const openFinServices = createOpenFinServices();
          setServices(openFinServices);

          logger.info('OpenFin workspace services initialized', undefined, 'OpenFinWorkspaceProvider');
        } else {
          logger.info('Not in OpenFin environment, using mock services', undefined, 'OpenFinWorkspaceProvider');

          // Use mock services for development
          const mockServices = createMockServices();
          setServices(mockServices);
        }

        setIsInitialized(true);
      } catch (error) {
        logger.error('Failed to initialize workspace services', error, 'OpenFinWorkspaceProvider');

        // Fallback to mock services on error
        const mockServices = createMockServices();
        setServices(mockServices);
        setIsInitialized(true);
      }
    };

    initializeServices();
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Initializing workspace services...</p>
        </div>
      </div>
    );
  }

  return (
    <OpenFinWorkspaceContext.Provider value={services}>
      {children}
    </OpenFinWorkspaceContext.Provider>
  );
};

/**
 * Hook to use OpenFin Workspace services
 */
export const useOpenFinWorkspace = (): OpenFinWorkspaceServices => {
  const context = useContext(OpenFinWorkspaceContext);

  if (!context) {
    throw new Error('useOpenFinWorkspace must be used within OpenFinWorkspaceProvider');
  }

  return context;
};