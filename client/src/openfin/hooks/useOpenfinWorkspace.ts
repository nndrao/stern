/**
 * React Hooks for OpenFin Workspace Services
 * Direct implementation using OpenFin APIs (no abstraction layer)
 *
 * Following workspace-starter patterns - uses OpenFin APIs directly
 */

import { useCallback } from 'react';
import { Dock } from '@openfin/workspace';
import { logger } from '@/utils/logger';

/**
 * Hook to check if running in OpenFin
 */
export const useIsOpenFin = (): boolean => {
  return typeof window !== 'undefined' && 'fin' in window;
};

/**
 * Hook for theme management
 * Direct OpenFin platform theme API access
 */
export const useOpenFinTheme = () => {
  const getCurrentTheme = useCallback(async (): Promise<string> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        return localStorage.getItem('stern-theme') || 'light';
      }
      const { getCurrentSync } = await import('@openfin/workspace-platform');
      const platform = getCurrentSync();
      const theme = await platform.Theme.getSelectedScheme();
      return theme as string;
    } catch (error) {
      logger.warn('Failed to get current theme', error, 'useOpenFinTheme');
      return 'light';
    }
  }, []);

  const setTheme = useCallback(async (theme: string): Promise<void> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        localStorage.setItem('stern-theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
        return;
      }
      const { getCurrentSync } = await import('@openfin/workspace-platform');
      const platform = getCurrentSync();
      await platform.Theme.setSelectedScheme(theme as any);
    } catch (error) {
      logger.error('Failed to set theme', error, 'useOpenFinTheme');
    }
  }, []);

  const subscribeToThemeChanges = useCallback((callback: (theme: string) => void) => {
    if (typeof window === 'undefined' || !window.fin) {
      // Browser fallback - use storage events
      const handler = (e: StorageEvent) => {
        if (e.key === 'stern-theme' && e.newValue) {
          callback(e.newValue);
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }

    // OpenFin doesn't have direct theme change events in current API
    // Theme changes are handled via IAB (Inter-Application Bus)
    return () => {};
  }, []);

  return {
    getCurrentTheme,
    setTheme,
    subscribeToThemeChanges
  };
};

/**
 * Hook for dock management
 * Direct OpenFin Dock API access
 */
export const useOpenFinDock = () => {
  const registerDock = useCallback(async (config: any): Promise<void> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        logger.debug('Mock: registerDock (not in OpenFin)', config, 'useOpenFinDock');
        return;
      }
      await Dock.register(config);
    } catch (error) {
      logger.error('Failed to register dock', error, 'useOpenFinDock');
      throw error;
    }
  }, []);

  const updateDock = useCallback(async (config: any): Promise<void> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        logger.debug('Mock: updateDock (not in OpenFin)', config, 'useOpenFinDock');
        return;
      }
      await Dock.deregister();
      await Dock.register(config);
    } catch (error) {
      logger.error('Failed to update dock', error, 'useOpenFinDock');
      throw error;
    }
  }, []);

  const showDock = useCallback(async (): Promise<void> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        logger.debug('Mock: showDock (not in OpenFin)', undefined, 'useOpenFinDock');
        return;
      }
      await Dock.show();
    } catch (error) {
      logger.error('Failed to show dock', error, 'useOpenFinDock');
      throw error;
    }
  }, []);

  const hideDock = useCallback(async (): Promise<void> => {
    logger.info('Hide dock not available in current OpenFin API version', undefined, 'useOpenFinDock');
  }, []);

  const deregisterDock = useCallback(async (): Promise<void> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        logger.debug('Mock: deregisterDock (not in OpenFin)', undefined, 'useOpenFinDock');
        return;
      }
      await Dock.deregister();
    } catch (error) {
      logger.error('Failed to deregister dock', error, 'useOpenFinDock');
      throw error;
    }
  }, []);

  return {
    registerDock,
    updateDock,
    showDock,
    hideDock,
    deregisterDock
  };
};

/**
 * Hook for view management
 * Direct OpenFin View API access
 */
export const useOpenFinView = () => {
  const getCurrentViewInfo = useCallback(async (): Promise<any> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        return null;
      }
      const view = fin.View.getCurrentSync();
      const info = await view.getInfo();
      return info;
    } catch (error) {
      logger.warn('Not in a view context', error, 'useOpenFinView');
      return null;
    }
  }, []);

  const closeCurrentView = useCallback(async (): Promise<void> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        return;
      }
      const view = fin.View.getCurrentSync();
      await view.close();
    } catch (error) {
      logger.error('Failed to close view', error, 'useOpenFinView');
      throw error;
    }
  }, []);

  const maximizeCurrentView = useCallback(async (): Promise<void> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        return;
      }
      const window = fin.Window.getCurrentSync();
      await window.maximize();
    } catch (error) {
      logger.error('Failed to maximize view', error, 'useOpenFinView');
      throw error;
    }
  }, []);

  const minimizeCurrentView = useCallback(async (): Promise<void> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        return;
      }
      const window = fin.Window.getCurrentSync();
      await window.minimize();
    } catch (error) {
      logger.error('Failed to minimize view', error, 'useOpenFinView');
      throw error;
    }
  }, []);

  const renameCurrentView = useCallback(async (name: string): Promise<void> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        return;
      }
      const view = fin.View.getCurrentSync();
      await view.updateOptions({ name });
    } catch (error) {
      logger.error('Failed to rename view', error, 'useOpenFinView');
      throw error;
    }
  }, []);

  const createView = useCallback(async (options: any): Promise<any> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        logger.debug('Mock: createView (not in OpenFin)', options, 'useOpenFinView');
        return { id: `mock-view-${Date.now()}` };
      }
      const { getCurrentSync } = await import('@openfin/workspace-platform');
      const platform = getCurrentSync();
      return await platform.createView(options);
    } catch (error) {
      logger.error('Failed to create view', error, 'useOpenFinView');
      throw error;
    }
  }, []);

  return {
    getCurrentViewInfo,
    closeCurrentView,
    maximizeCurrentView,
    minimizeCurrentView,
    renameCurrentView,
    createView
  };
};

/**
 * Hook for window management
 * Direct OpenFin Window API access
 */
export const useOpenFinWindow = () => {
  const createWindow = useCallback(async (options: any): Promise<any> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        logger.debug('Mock: createWindow (not in OpenFin)', options, 'useOpenFinWindow');
        window.open(options.url, '_blank');
        return { id: `mock-window-${Date.now()}` };
      }
      const { getCurrentSync } = await import('@openfin/workspace-platform');
      const platform = getCurrentSync();
      return await platform.createWindow(options);
    } catch (error) {
      logger.error('Failed to create window', error, 'useOpenFinWindow');
      throw error;
    }
  }, []);

  const getCurrentWindow = useCallback(() => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        return window;
      }
      return fin.Window.getCurrentSync();
    } catch {
      // If in a view, get the parent window
      try {
        const view = fin.View.getCurrentSync();
        return view.getCurrentWindow();
      } catch {
        return null;
      }
    }
  }, []);

  return {
    createWindow,
    getCurrentWindow
  };
};

/**
 * Hook for inter-application communication
 * Direct OpenFin IAB (Inter-Application Bus) API access
 */
export const useOpenFinMessaging = () => {
  const broadcastToAllViews = useCallback(async (message: any, topic = 'default'): Promise<void> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        logger.debug('Mock: broadcastToAllViews (not in OpenFin)', { topic, message }, 'useOpenFinMessaging');
        window.postMessage({ topic, message }, '*');
        return;
      }
      await fin.InterApplicationBus.publish(topic, message);
    } catch (error) {
      logger.error('Failed to broadcast message', error, 'useOpenFinMessaging');
      throw error;
    }
  }, []);

  const subscribeToMessages = useCallback((topic: string, callback: (message: any) => void) => {
    if (typeof window === 'undefined' || !window.fin) {
      // Browser fallback
      const handler = (e: MessageEvent) => {
        if (e.data?.topic === topic) {
          callback(e.data.message);
        }
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }

    logger.info(`[IAB] Subscribing to topic: ${topic}`, undefined, 'useOpenFinMessaging');

    const wrappedCallback = (message: any, identity: any) => {
      logger.info(`[IAB] Received message on topic: ${topic}`, {
        message,
        from: identity?.uuid,
        timestamp: new Date().toISOString()
      }, 'useOpenFinMessaging');
      callback(message, identity);
    };

    fin.InterApplicationBus.subscribe({ uuid: '*' }, topic, wrappedCallback);

    logger.info(`[IAB] Successfully subscribed to topic: ${topic}`, undefined, 'useOpenFinMessaging');

    return () => {
      logger.info(`[IAB] Unsubscribing from topic: ${topic}`, undefined, 'useOpenFinMessaging');
      fin.InterApplicationBus.unsubscribe({ uuid: '*' }, topic, wrappedCallback);
    };
  }, []);

  const sendToView = useCallback(async (viewId: string, message: any): Promise<void> => {
    try {
      if (typeof window === 'undefined' || !window.fin) {
        logger.debug('Mock: sendToView (not in OpenFin)', { viewId, message }, 'useOpenFinMessaging');
        return;
      }
      await fin.InterApplicationBus.send({ uuid: fin.me.uuid, name: viewId }, 'direct-message', message);
    } catch (error) {
      logger.error('Failed to send message to view', error, 'useOpenFinMessaging');
      throw error;
    }
  }, []);

  return {
    broadcastToAllViews,
    subscribeToMessages,
    sendToView
  };
};

/**
 * Hook for workspace events
 * Note: Some events are not directly available in current OpenFin API
 */
export const useOpenFinWorkspaceEvents = () => {
  const onWorkspaceSaved = useCallback((callback: (workspace: any) => void) => {
    logger.debug('Workspace events not directly available in current API', undefined, 'useOpenFinWorkspaceEvents');
    return () => {};
  }, []);

  const onWorkspaceLoaded = useCallback((callback: (workspace: any) => void) => {
    logger.debug('Workspace events not directly available in current API', undefined, 'useOpenFinWorkspaceEvents');
    return () => {};
  }, []);

  const onViewClosed = useCallback((callback: (viewId: string) => void) => {
    logger.debug('View events not directly available in current API', undefined, 'useOpenFinWorkspaceEvents');
    return () => {};
  }, []);

  const onViewFocused = useCallback((callback: (viewId: string) => void) => {
    logger.debug('View events not directly available in current API', undefined, 'useOpenFinWorkspaceEvents');
    return () => {};
  }, []);

  return {
    onWorkspaceSaved,
    onWorkspaceLoaded,
    onViewClosed,
    onViewFocused
  };
};

/**
 * Main hook providing access to all OpenFin workspace services
 * This is a convenience hook that bundles all the individual hooks together
 */
export const useOpenFinWorkspace = () => {
  const isOpenFin = useIsOpenFin();
  const theme = useOpenFinTheme();
  const dock = useOpenFinDock();
  const view = useOpenFinView();
  const window = useOpenFinWindow();
  const messaging = useOpenFinMessaging();
  const events = useOpenFinWorkspaceEvents();

  return {
    // Environment check
    isOpenFin,

    // Theme services
    getCurrentTheme: theme.getCurrentTheme,
    setTheme: theme.setTheme,
    subscribeToThemeChanges: theme.subscribeToThemeChanges,

    // Dock management
    registerDock: dock.registerDock,
    updateDock: dock.updateDock,
    showDock: dock.showDock,
    hideDock: dock.hideDock,
    deregisterDock: dock.deregisterDock,

    // View management
    getCurrentViewInfo: view.getCurrentViewInfo,
    closeCurrentView: view.closeCurrentView,
    maximizeCurrentView: view.maximizeCurrentView,
    minimizeCurrentView: view.minimizeCurrentView,
    renameCurrentView: view.renameCurrentView,
    createView: view.createView,

    // Window management
    createWindow: window.createWindow,
    getCurrentWindow: window.getCurrentWindow,

    // Cross-view communication
    broadcastToAllViews: messaging.broadcastToAllViews,
    subscribeToMessages: messaging.subscribeToMessages,
    sendToView: messaging.sendToView,

    // Workspace events
    onWorkspaceSaved: events.onWorkspaceSaved,
    onWorkspaceLoaded: events.onWorkspaceLoaded,
    onViewClosed: events.onViewClosed,
    onViewFocused: events.onViewFocused,

    // Page management (not implemented in current API)
    renameCurrentPage: async (name: string) => {
      logger.debug('renameCurrentPage not implemented', { name }, 'useOpenFinWorkspace');
    },
    getCurrentPage: async () => {
      logger.debug('getCurrentPage not implemented', undefined, 'useOpenFinWorkspace');
      return null;
    }
  };
};

// Export interface for TypeScript types
export interface OpenFinWorkspaceServices {
  isOpenFin: boolean;
  getCurrentTheme: () => Promise<string>;
  setTheme: (theme: string) => Promise<void>;
  subscribeToThemeChanges: (callback: (theme: string) => void) => () => void;
  registerDock: (config: any) => Promise<void>;
  updateDock: (config: any) => Promise<void>;
  showDock: () => Promise<void>;
  hideDock: () => Promise<void>;
  deregisterDock: () => Promise<void>;
  getCurrentViewInfo: () => Promise<any>;
  closeCurrentView: () => Promise<void>;
  maximizeCurrentView: () => Promise<void>;
  minimizeCurrentView: () => Promise<void>;
  renameCurrentView: (name: string) => Promise<void>;
  createView: (options: any) => Promise<any>;
  createWindow: (options: any) => Promise<any>;
  getCurrentWindow: () => any;
  broadcastToAllViews: (message: any, topic?: string) => Promise<void>;
  subscribeToMessages: (topic: string, callback: (message: any) => void) => () => void;
  sendToView: (viewId: string, message: any) => Promise<void>;
  onWorkspaceSaved: (callback: (workspace: any) => void) => () => void;
  onWorkspaceLoaded: (callback: (workspace: any) => void) => () => void;
  onViewClosed: (callback: (viewId: string) => void) => () => void;
  onViewFocused: (callback: (viewId: string) => void) => () => void;
  renameCurrentPage: (name: string) => Promise<void>;
  getCurrentPage: () => Promise<any>;
}
