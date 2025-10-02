/**
 * React Hook for OpenFin Workspace Services
 * Provides easy access to OpenFin workspace functionality
 */

import { useOpenFinWorkspace as useOpenFinWorkspaceFromProvider } from '../services/openfin/OpenFinWorkspaceProvider';

// Re-export the hook from the provider for convenience
export { useOpenFinWorkspace } from '../services/openfin/OpenFinWorkspaceProvider';

// Export the service interface for type usage
export type { OpenFinWorkspaceServices } from '../services/openfin/OpenFinWorkspaceProvider';

/**
 * Hook to check if running in OpenFin
 */
export const useIsOpenFin = (): boolean => {
  try {
    const workspace = useOpenFinWorkspaceFromProvider();
    return workspace.isOpenFin;
  } catch {
    return false;
  }
};

/**
 * Hook for theme management
 */
export const useOpenFinTheme = () => {
  const workspace = useOpenFinWorkspaceFromProvider();

  return {
    getCurrentTheme: workspace.getCurrentTheme,
    setTheme: workspace.setTheme,
    subscribeToThemeChanges: workspace.subscribeToThemeChanges
  };
};

/**
 * Hook for dock management
 */
export const useOpenFinDock = () => {
  const workspace = useOpenFinWorkspaceFromProvider();

  return {
    registerDock: workspace.registerDock,
    updateDock: workspace.updateDock,
    showDock: workspace.showDock,
    hideDock: workspace.hideDock,
    deregisterDock: workspace.deregisterDock
  };
};

/**
 * Hook for view management
 */
export const useOpenFinView = () => {
  const workspace = useOpenFinWorkspaceFromProvider();

  return {
    getCurrentViewInfo: workspace.getCurrentViewInfo,
    closeCurrentView: workspace.closeCurrentView,
    maximizeCurrentView: workspace.maximizeCurrentView,
    minimizeCurrentView: workspace.minimizeCurrentView,
    renameCurrentView: workspace.renameCurrentView,
    createView: workspace.createView
  };
};

/**
 * Hook for window management
 */
export const useOpenFinWindow = () => {
  const workspace = useOpenFinWorkspaceFromProvider();

  return {
    createWindow: workspace.createWindow,
    getCurrentWindow: workspace.getCurrentWindow
  };
};

/**
 * Hook for inter-application communication
 */
export const useOpenFinMessaging = () => {
  const workspace = useOpenFinWorkspaceFromProvider();

  return {
    broadcastToAllViews: workspace.broadcastToAllViews,
    subscribeToMessages: workspace.subscribeToMessages,
    sendToView: workspace.sendToView
  };
};

/**
 * Hook for workspace events
 */
export const useOpenFinWorkspaceEvents = () => {
  const workspace = useOpenFinWorkspaceFromProvider();

  return {
    onWorkspaceSaved: workspace.onWorkspaceSaved,
    onWorkspaceLoaded: workspace.onWorkspaceLoaded,
    onViewClosed: workspace.onViewClosed,
    onViewFocused: workspace.onViewFocused
  };
};