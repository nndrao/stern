import { WindowManager } from './WindowManager';
import type { DialogWindowOptions } from '../../types/openfin';

export interface DialogConfig {
  id: string;
  title: string;
  component: string;
  width: number;
  height: number;
  resizable?: boolean;
  modal?: boolean;
  data?: any;
}

export interface DialogResult {
  action: 'ok' | 'cancel' | 'close';
  data?: any;
}

export class DialogService {
  private static instance: DialogService;
  private windowManager: WindowManager;
  private activeDialogs: Map<string, DialogConfig> = new Map();
  private dialogPromises: Map<string, {
    resolve: (result: DialogResult) => void;
    reject: (error: Error) => void;
  }> = new Map();

  private constructor() {
    this.windowManager = WindowManager.getInstance();

    try {
      this.setupMessageHandling();
    } catch (error) {
      console.warn('Failed to setup message handling in DialogService:', error);
    }
  }

  static getInstance(): DialogService {
    if (!DialogService.instance) {
      DialogService.instance = new DialogService();
    }
    return DialogService.instance;
  }

  /**
   * Show a standard dialog
   */
  async showDialog(config: DialogConfig): Promise<DialogResult> {
    try {
      // Check if dialog is already open
      if (this.activeDialogs.has(config.id)) {
        const existingWindow = this.windowManager.getWindow(`dialog-${config.id}`);
        if (existingWindow) {
          await existingWindow.focus();
          throw new Error(`Dialog ${config.id} is already open`);
        }
      }

      // Create dialog window
      const windowName = `dialog-${config.id}`;
      const dialogUrl = `/dialog/${config.component}?id=${config.id}`;

      const windowOptions: DialogWindowOptions = {
        name: windowName,
        url: dialogUrl,
        width: config.width,
        height: config.height,
        resizable: config.resizable !== false,
        minimizable: false,
        maximizable: false,
        alwaysOnTop: config.modal !== false
      };

      const window = await this.windowManager.createDialogWindow(windowOptions);

      // Store dialog config
      this.activeDialogs.set(config.id, config);

      // Return promise that resolves when dialog closes
      return new Promise<DialogResult>((resolve, reject) => {
        this.dialogPromises.set(config.id, { resolve, reject });

        // Handle window close event
        window.addListener('closed', () => {
          this.handleDialogClose(config.id, { action: 'close' });
        });

        // Send initial data to dialog
        if (config.data) {
          setTimeout(() => {
            this.sendMessageToDialog(config.id, {
              type: 'init',
              data: config.data
            });
          }, 1000);
        }
      });

    } catch (error) {
      console.error('Failed to show dialog:', error);
      throw error;
    }
  }

  /**
   * Show a core window dialog (for complex customization features)
   */
  async showCoreDialog(config: DialogConfig): Promise<DialogResult> {
    try {
      // Create core window
      const windowName = `core-dialog-${config.id}`;
      const dialogUrl = `/dialog/core/${config.component}?id=${config.id}`;

      const windowOptions: DialogWindowOptions = {
        name: windowName,
        url: dialogUrl,
        width: config.width,
        height: config.height,
        resizable: config.resizable !== false,
        minimizable: false,
        maximizable: false,
        alwaysOnTop: true
      };

      const window = await this.windowManager.createCoreWindow(windowOptions);

      // Store dialog config
      this.activeDialogs.set(config.id, { ...config, modal: true });

      // Return promise that resolves when dialog closes
      return new Promise<DialogResult>((resolve, reject) => {
        this.dialogPromises.set(config.id, { resolve, reject });

        // Handle window close event
        window.addListener('closed', () => {
          this.handleDialogClose(config.id, { action: 'close' });
        });

        // Send initial data to dialog
        if (config.data) {
          setTimeout(() => {
            this.sendMessageToDialog(config.id, {
              type: 'init',
              data: config.data
            });
          }, 1000);
        }
      });

    } catch (error) {
      console.error('Failed to show core dialog:', error);
      throw error;
    }
  }

  /**
   * Close dialog programmatically
   */
  async closeDialog(dialogId: string, result?: DialogResult): Promise<void> {
    try {
      const windowName = `dialog-${dialogId}`;
      const coreWindowName = `core-dialog-${dialogId}`;

      // Try closing regular dialog
      let closed = await this.windowManager.closeWindow(windowName);

      // Try closing core dialog if regular dialog wasn't found
      if (!closed) {
        closed = await this.windowManager.closeWindow(coreWindowName);
      }

      if (closed) {
        this.handleDialogClose(dialogId, result || { action: 'close' });
      }
    } catch (error) {
      console.error(`Failed to close dialog ${dialogId}:`, error);
    }
  }

  /**
   * Send message to dialog window
   */
  async sendMessageToDialog(dialogId: string, message: any): Promise<void> {
    try {
      const windowName = `dialog-${dialogId}`;
      const coreWindowName = `core-dialog-${dialogId}`;

      let window = this.windowManager.getWindow(windowName);
      if (!window) {
        window = this.windowManager.getWindow(coreWindowName);
      }

      if (window) {
        await (window as any).postMessage(message);
      }
    } catch (error) {
      console.error(`Failed to send message to dialog ${dialogId}:`, error);
    }
  }

  /**
   * Get active dialog configs
   */
  getActiveDialogs(): DialogConfig[] {
    return Array.from(this.activeDialogs.values());
  }

  /**
   * Check if dialog is open
   */
  isDialogOpen(dialogId: string): boolean {
    return this.activeDialogs.has(dialogId);
  }

  /**
   * Setup inter-window message handling
   */
  private setupMessageHandling(): void {
    if (typeof window === 'undefined' || !window.fin) {
      console.log('OpenFin not available, skipping message handling setup');
      return;
    }

    try {
      // Listen for messages from dialog windows
      // Use the current platform's UUID instead of wildcard
      const currentApp = fin.Application.getCurrentSync();
      const uuid = currentApp.identity.uuid;

      if (!uuid) {
        console.warn('No UUID available for InterApplicationBus subscription');
        return;
      }

      fin.InterApplicationBus.subscribe(uuid as any, 'dialog-message', (message: any) => {
        console.log('Received dialog message:', message);
        this.handleDialogMessage(message);
      }).catch((error: any) => {
        console.warn('Failed to subscribe to dialog messages:', error);
      });
    } catch (error) {
      console.warn('Error in setupMessageHandling:', error);
    }
  }

  /**
   * Handle messages from dialog windows
   */
  private handleDialogMessage(message: any): void {
    const { dialogId, type, result } = message;

    switch (type) {
      case 'ready':
        console.log(`Dialog ${dialogId} is ready`);
        break;

      case 'result':
        this.handleDialogClose(dialogId, result);
        break;

      case 'data-request':
        // Dialog is requesting additional data
        const config = this.activeDialogs.get(dialogId);
        if (config && config.data) {
          this.sendMessageToDialog(dialogId, {
            type: 'data-response',
            data: config.data
          });
        }
        break;

      default:
        console.warn('Unknown dialog message type:', type);
    }
  }

  /**
   * Handle dialog close and resolve promise
   */
  private handleDialogClose(dialogId: string, result: DialogResult): void {
    const promise = this.dialogPromises.get(dialogId);
    if (promise) {
      promise.resolve(result);
      this.dialogPromises.delete(dialogId);
    }

    this.activeDialogs.delete(dialogId);
    console.log(`Dialog ${dialogId} closed with result:`, result);
  }

  /**
   * Cleanup all dialogs
   */
  async cleanup(): Promise<void> {
    const closePromises = Array.from(this.activeDialogs.keys()).map(dialogId =>
      this.closeDialog(dialogId, { action: 'close' })
    );

    await Promise.allSettled(closePromises);
    this.activeDialogs.clear();
    this.dialogPromises.clear();
  }
}

export default DialogService;