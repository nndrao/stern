import type { BlotterWindowOptions, DialogWindowOptions } from '../../types/openfin';

export class WindowManager {
  private static instance: WindowManager;
  private openWindows: Map<string, any> = new Map();
  private windowConfigs: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager();
    }
    return WindowManager.instance;
  }

  /**
   * Create a new blotter window
   */
  async createBlotterWindow(options: BlotterWindowOptions): Promise<any> {
    try {
      const windowOptions: any = {
        name: options.name,
        url: options.url,
        bounds: options.bounds || {
          x: 100,
          y: 100,
          width: 1200,
          height: 800
        },
        autoShow: true,
        frame: true,
        resizable: true,
        maximizable: true,
        minimizable: true,
        backgroundColor: '#1e293b',
        saveWindowState: false,
        processAffinity: options.processAffinity || 'stern-blotter',
        permissions: {
          System: {
            launchExternalProcess: true,
            openUrlWithBrowser: {
              enabled: true,
              protocols: ['mailto', 'https']
            }
          }
        }
      };

      const window = await fin.Window.create(windowOptions);

      // Store window reference
      this.openWindows.set(options.name, window);

      // Store configuration if provided
      if (options.configurationId) {
        this.windowConfigs.set(options.name, {
          configurationId: options.configurationId,
          type: 'blotter'
        });
      }

      // Set up window event listeners
      this.setupWindowEventListeners(window, options.name);

      console.log(`Blotter window created: ${options.name}`);
      return window;

    } catch (error) {
      console.error('Failed to create blotter window:', error);
      throw error;
    }
  }

  /**
   * Create a dialog window
   */
  async createDialogWindow(options: DialogWindowOptions): Promise<any> {
    try {
      const windowOptions: any = {
        name: options.name,
        url: options.url,
        bounds: {
          x: 0,
          y: 0,
          width: options.width || (options.bounds ? options.bounds.width : 400),
          height: options.height || (options.bounds ? options.bounds.height : 300)
        },
        autoShow: true,
        frame: true,
        resizable: options.resizable !== false,
        maximizable: options.maximizable !== false,
        minimizable: options.minimizable !== false,
        alwaysOnTop: options.alwaysOnTop || false,
        backgroundColor: '#ffffff',
        saveWindowState: false,
        processAffinity: 'stern-dialog'
      };

      const window = await fin.Window.create(windowOptions);

      // Center the dialog
      await this.centerWindow(window, options.width || (options.bounds ? options.bounds.width : 400), options.height || (options.bounds ? options.bounds.height : 300));

      // Store window reference
      this.openWindows.set(options.name, window);

      // Set up window event listeners
      this.setupWindowEventListeners(window, options.name);

      console.log(`Dialog window created: ${options.name}`);
      return window;

    } catch (error) {
      console.error('Failed to create dialog window:', error);
      throw error;
    }
  }

  /**
   * Create a core window (for advanced customization dialogs)
   */
  async createCoreWindow(options: DialogWindowOptions): Promise<any> {
    try {
      const windowOptions: any = {
        name: options.name,
        url: options.url,
        bounds: {
          x: 0,
          y: 0,
          width: options.width || (options.bounds ? options.bounds.width : 400),
          height: options.height || (options.bounds ? options.bounds.height : 300)
        },
        autoShow: true,
        frame: true,
        resizable: options.resizable !== false,
        maximizable: options.maximizable !== false,
        minimizable: options.minimizable !== false,
        alwaysOnTop: options.alwaysOnTop || true,
        backgroundColor: '#ffffff',
        saveWindowState: false,
        processAffinity: 'stern-core',
        showTaskbarIcon: false
      };

      const window = await fin.Window.create(windowOptions);

      // Center the core window
      await this.centerWindow(window, options.width || (options.bounds ? options.bounds.width : 400), options.height || (options.bounds ? options.bounds.height : 300));

      // Store window reference
      this.openWindows.set(options.name, window);

      // Store as core window type
      this.windowConfigs.set(options.name, {
        type: 'core-dialog',
        parentWindow: options.parentWindow
      });

      // Set up window event listeners
      this.setupWindowEventListeners(window, options.name);

      console.log(`Core window created: ${options.name}`);
      return window;

    } catch (error) {
      console.error('Failed to create core window:', error);
      throw error;
    }
  }

  /**
   * Get window by name
   */
  getWindow(name: string): any | undefined {
    return this.openWindows.get(name);
  }

  /**
   * Close window by name
   */
  async closeWindow(name: string): Promise<boolean> {
    try {
      const window = this.openWindows.get(name);
      if (window) {
        await window.close();
        this.openWindows.delete(name);
        this.windowConfigs.delete(name);
        console.log(`Window closed: ${name}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to close window ${name}:`, error);
      return false;
    }
  }

  /**
   * Get all open windows
   */
  getOpenWindows(): string[] {
    return Array.from(this.openWindows.keys());
  }

  /**
   * Get window configuration
   */
  getWindowConfig(name: string): any {
    return this.windowConfigs.get(name);
  }

  /**
   * Check if running in OpenFin
   */
  isOpenFin(): boolean {
    return typeof window !== 'undefined' && 'fin' in window;
  }

  /**
   * Center window on screen
   */
  private async centerWindow(window: any, width: number, height: number): Promise<void> {
    try {
      const bounds = await window.getBounds();
      const monitor = await fin.System.getMonitorInfo();

      const primaryMonitor = monitor.primaryMonitor;
      const centerX = primaryMonitor.availableRect.left +
                    (primaryMonitor.availableRect.right - primaryMonitor.availableRect.left - width) / 2;
      const centerY = primaryMonitor.availableRect.top +
                    (primaryMonitor.availableRect.bottom - primaryMonitor.availableRect.top - height) / 2;

      await window.setBounds({
        ...bounds,
        x: Math.round(centerX),
        y: Math.round(centerY)
      });
    } catch (error) {
      console.warn('Could not center window:', error);
    }
  }

  /**
   * Set up event listeners for window lifecycle
   */
  private setupWindowEventListeners(window: any, name: string): void {
    // Handle window close
    window.addListener('closed', () => {
      console.log(`Window closed: ${name}`);
      this.openWindows.delete(name);
      this.windowConfigs.delete(name);
    });

    // Handle window minimize
    window.addListener('minimized', () => {
      console.log(`Window minimized: ${name}`);
    });

    // Handle window maximize
    window.addListener('maximized', () => {
      console.log(`Window maximized: ${name}`);
    });

    // Handle window restore
    window.addListener('restored', () => {
      console.log(`Window restored: ${name}`);
    });

    // Handle window focus
    window.addListener('focused', () => {
      console.log(`Window focused: ${name}`);
    });
  }

  /**
   * Cleanup all windows
   */
  async cleanup(): Promise<void> {
    const closePromises = Array.from(this.openWindows.keys()).map(name =>
      this.closeWindow(name)
    );

    await Promise.allSettled(closePromises);
    this.openWindows.clear();
    this.windowConfigs.clear();
  }
}

export default WindowManager;