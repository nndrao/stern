import '@openfin/core';

declare global {
  interface Window {
    fin: typeof fin;
  }
}

export interface SternPlatformSettings {
  theme: 'light' | 'dark';
  locale: string;
  features: {
    home: boolean;
    dock: boolean;
    store: boolean;
    notifications: boolean;
  };
}

export interface BlotterWindowOptions {
  name: string;
  url: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  processAffinity?: string;
  configurationId?: string;
}

export interface DialogWindowOptions {
  name: string;
  url: string;
  width: number;
  height: number;
  resizable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  modal?: boolean;
  alwaysOnTop?: boolean;
  parentWindow?: string;
}

export interface SternWorkspaceSettings {
  home?: {
    title: string;
    icon: string;
    provider: string;
  };
  dock?: {
    title: string;
    icon: string;
    provider: string;
  };
  store?: {
    title: string;
    icon: string;
    provider: string;
  };
}

export interface FDC3ContextData {
  type: string;
  id?: {
    [key: string]: string;
  };
  name?: string;
  [key: string]: any;
}

export interface SternWindowFactory {
  createBlotterWindow(options: BlotterWindowOptions): Promise<OpenFin.Window>;
  createDialogWindow(options: DialogWindowOptions): Promise<OpenFin.Window>;
  createCoreWindow(options: DialogWindowOptions): Promise<OpenFin.Window>;
}

export interface SternInteropService {
  broadcastContext(context: FDC3ContextData): Promise<void>;
  addContextListener(handler: (context: FDC3ContextData) => void): Promise<OpenFin.ChannelProvider.ChannelReceiver>;
  removeContextListener(listener: OpenFin.ChannelProvider.ChannelReceiver): Promise<void>;
  raiseIntent(intent: string, context: FDC3ContextData): Promise<void>;
  addIntentListener(intent: string, handler: (context: FDC3ContextData) => void): Promise<void>;
}

export interface PlatformProviderOptions {
  settings: SternPlatformSettings;
  workspace: SternWorkspaceSettings;
  windowFactory: SternWindowFactory;
  interopService: SternInteropService;
}