import { useCallback, useEffect, useState } from 'react';
import { usePlatform } from '../contexts/PlatformContext';
import { WindowManager } from '../services/openfin/WindowManager';
import { DialogService, type DialogConfig, type DialogResult } from '../services/openfin/DialogService';
import type { BlotterWindowOptions, DialogWindowOptions, FDC3ContextData } from '../types/openfin';

export interface UseOpenFinReturn {
  isOpenFin: boolean;
  isInitialized: boolean;
  windowManager: WindowManager | null;
  dialogService: DialogService | null;
  createBlotterWindow: (options: BlotterWindowOptions) => Promise<any | null>;
  createDialogWindow: (options: DialogWindowOptions) => Promise<any | null>;
  showDialog: (config: DialogConfig) => Promise<DialogResult | null>;
  showCoreDialog: (config: DialogConfig) => Promise<DialogResult | null>;
  closeWindow: (name: string) => Promise<boolean>;
  broadcastContext: (context: FDC3ContextData) => Promise<void>;
  addContextListener: (handler: (context: FDC3ContextData) => void) => Promise<void>;
  getCurrentWindow: () => any | null;
  getOpenWindows: () => string[];
}

/**
 * Custom hook for OpenFin functionality
 * Provides a unified interface for window management, dialogs, and interop
 */
export const useOpenFin = (): UseOpenFinReturn => {
  const { isOpenFin, isInitialized } = usePlatform();
  const [windowManager, setWindowManager] = useState<WindowManager | null>(null);
  const [dialogService, setDialogService] = useState<DialogService | null>(null);
  const [currentWindow, setCurrentWindow] = useState<any | null>(null);

  // Initialize services when platform is ready
  useEffect(() => {
    if (isOpenFin && isInitialized) {
      const wm = WindowManager.getInstance();
      const ds = DialogService.getInstance();

      setWindowManager(wm);
      setDialogService(ds);

      // Get current window reference
      if (window.fin) {
        fin.Window.getCurrent()
          .then(window => setCurrentWindow(window as any))
          .catch(error => console.warn('Could not get current window:', error));
      }
    }
  }, [isOpenFin, isInitialized]);

  // Create blotter window
  const createBlotterWindow = useCallback(async (options: BlotterWindowOptions): Promise<any | null> => {
    if (!windowManager) {
      console.warn('WindowManager not available');
      return null;
    }

    try {
      return await windowManager.createBlotterWindow(options);
    } catch (error) {
      console.error('Failed to create blotter window:', error);
      return null;
    }
  }, [windowManager]);

  // Create dialog window
  const createDialogWindow = useCallback(async (options: DialogWindowOptions): Promise<any | null> => {
    if (!windowManager) {
      console.warn('WindowManager not available');
      return null;
    }

    try {
      return await windowManager.createDialogWindow(options);
    } catch (error) {
      console.error('Failed to create dialog window:', error);
      return null;
    }
  }, [windowManager]);

  // Show dialog
  const showDialog = useCallback(async (config: DialogConfig): Promise<DialogResult | null> => {
    if (!dialogService) {
      console.warn('DialogService not available');
      return null;
    }

    try {
      return await dialogService.showDialog(config);
    } catch (error) {
      console.error('Failed to show dialog:', error);
      return null;
    }
  }, [dialogService]);

  // Show core dialog
  const showCoreDialog = useCallback(async (config: DialogConfig): Promise<DialogResult | null> => {
    if (!dialogService) {
      console.warn('DialogService not available');
      return null;
    }

    try {
      return await dialogService.showCoreDialog(config);
    } catch (error) {
      console.error('Failed to show core dialog:', error);
      return null;
    }
  }, [dialogService]);

  // Close window
  const closeWindow = useCallback(async (name: string): Promise<boolean> => {
    if (!windowManager) {
      console.warn('WindowManager not available');
      return false;
    }

    try {
      return await windowManager.closeWindow(name);
    } catch (error) {
      console.error('Failed to close window:', error);
      return false;
    }
  }, [windowManager]);

  // Broadcast FDC3 context
  const broadcastContext = useCallback(async (context: FDC3ContextData): Promise<void> => {
    if (!isOpenFin) {
      console.warn('FDC3 context broadcast not available outside OpenFin');
      return;
    }

    try {
      await (fin as any).me.interop.setContext(context);
      console.log('Context broadcasted:', context);
    } catch (error) {
      console.error('Failed to broadcast context:', error);
    }
  }, [isOpenFin]);

  // Add context listener
  const addContextListener = useCallback(async (handler: (context: FDC3ContextData) => void): Promise<void> => {
    if (!isOpenFin) {
      console.warn('FDC3 context listeners not available outside OpenFin');
      return;
    }

    try {
      await (fin as any).me.interop.addContextHandler(handler);
      console.log('Context listener added');
    } catch (error) {
      console.error('Failed to add context listener:', error);
    }
  }, [isOpenFin]);

  // Get current window
  const getCurrentWindow = useCallback((): any | null => {
    return currentWindow;
  }, [currentWindow]);

  // Get open windows
  const getOpenWindows = useCallback((): string[] => {
    if (!windowManager) {
      return [];
    }
    return windowManager.getOpenWindows();
  }, [windowManager]);

  return {
    isOpenFin,
    isInitialized: isInitialized && !!windowManager && !!dialogService,
    windowManager,
    dialogService,
    createBlotterWindow,
    createDialogWindow,
    showDialog,
    showCoreDialog,
    closeWindow,
    broadcastContext,
    addContextListener,
    getCurrentWindow,
    getOpenWindows
  };
};

/**
 * Hook for window-specific OpenFin functionality
 */
export const useOpenFinWindow = () => {
  const [window, setWindow] = useState<any | null>(null);
  const [bounds, setBounds] = useState<any | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { isOpenFin } = usePlatform();

  useEffect(() => {
    if (!isOpenFin) return;

    const initWindow = async () => {
      try {
        const currentWindow = await fin.Window.getCurrent();
        setWindow(currentWindow as any);

        // Get initial bounds
        const initialBounds = await currentWindow.getBounds();
        setBounds(initialBounds as any);

        // Set up event listeners
        currentWindow.addListener('bounds-changed', (event: any) => {
          setBounds(event as any);
        });

        currentWindow.addListener('maximized', () => {
          setIsMaximized(true);
        });

        currentWindow.addListener('minimized', () => {
          setIsMinimized(true);
        });

        currentWindow.addListener('restored', () => {
          setIsMaximized(false);
          setIsMinimized(false);
        });

      } catch (error) {
        console.warn('Could not initialize window listeners:', error);
      }
    };

    initWindow();
  }, [isOpenFin]);

  const maximize = useCallback(async () => {
    if (window) {
      await window.maximize();
    }
  }, [window]);

  const minimize = useCallback(async () => {
    if (window) {
      await window.minimize();
    }
  }, [window]);

  const restore = useCallback(async () => {
    if (window) {
      await window.restore();
    }
  }, [window]);

  const close = useCallback(async () => {
    if (window) {
      await window.close();
    }
  }, [window]);

  const focus = useCallback(async () => {
    if (window) {
      await window.focus();
    }
  }, [window]);

  return {
    window,
    bounds,
    isMaximized,
    isMinimized,
    maximize,
    minimize,
    restore,
    close,
    focus
  };
};

export default useOpenFin;