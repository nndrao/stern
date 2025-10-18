/**
 * Simple OpenFin utility functions
 * Direct API usage without complex abstractions
 */

// Re-export URL utilities
export * from './urlHelper';

export const createWindow = (url: string, options: any = {}) =>
  fin.Window.create({
    url,
    autoShow: true,
    bounds: { width: 1200, height: 800 },
    ...options
  });

export const launchApp = (manifest: string) =>
  fin.Application.startFromManifest(manifest);

export const broadcastMessage = (topic: string, data: any) =>
  fin.InterApplicationBus.publish(topic, data);

export const subscribeToMessage = (topic: string, handler: (message: any, identity: any) => void) =>
  fin.InterApplicationBus.subscribe({ uuid: '*' }, topic, handler);

export const getCurrentWindow = () => fin.Window.getCurrent();

export const isOpenFin = () => typeof window !== 'undefined' && 'fin' in window;

export const setTheme = async (theme: 'light' | 'dark') => {
  const { getCurrentSync } = await import('@openfin/workspace-platform');
  const platform = getCurrentSync();
  await platform.Theme.setSelectedScheme(theme as any);
};