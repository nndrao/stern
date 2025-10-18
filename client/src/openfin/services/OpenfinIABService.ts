/**
 * IAB (Inter-Application Bus) Service
 *
 * Wrapper around OpenFin's IAB for type-safe message passing
 * between windows and dialogs
 */

import { logger } from '@/utils/logger';

export interface IABMessage<T = any> {
  type: string;
  payload: T;
  timestamp: string;
  source?: {
    windowName?: string;
    configId?: string;
  };
}

export type IABMessageHandler<T = any> = (message: IABMessage<T>) => void;

class IABService {
  private subscriptions: Map<string, Set<IABMessageHandler>> = new Map();
  private isOpenFin: boolean = false;

  constructor() {
    this.isOpenFin = typeof window !== 'undefined' && 'fin' in window;
  }

  /**
   * Subscribe to a topic
   * Returns unsubscribe function
   */
  subscribe<T = any>(topic: string, handler: IABMessageHandler<T>): () => void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }

    const handlers = this.subscriptions.get(topic)!;
    handlers.add(handler as IABMessageHandler);

    // Setup OpenFin IAB subscription if in OpenFin environment
    if (this.isOpenFin) {
      this.setupOpenFinSubscription(topic);
    }

    logger.debug('IAB subscribed', { topic }, 'IABService');

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as IABMessageHandler);
      if (handlers.size === 0) {
        this.subscriptions.delete(topic);
      }
      logger.debug('IAB unsubscribed', { topic }, 'IABService');
    };
  }

  /**
   * Broadcast message to all subscribers of a topic
   */
  async broadcast<T = any>(topic: string, payload: T, source?: any): Promise<void> {
    const message: IABMessage<T> = {
      type: topic,
      payload,
      timestamp: new Date().toISOString(),
      source
    };

    // Broadcast via OpenFin IAB if available
    if (this.isOpenFin) {
      try {
        const fin = (window as any).fin;
        await fin.InterApplicationBus.publish(topic, message);
        logger.debug('IAB broadcast (OpenFin)', { topic, payload }, 'IABService');
      } catch (error) {
        logger.error('IAB broadcast failed', error, 'IABService');
      }
    } else {
      // In browser, just call local handlers
      this.handleMessage(topic, message);
      logger.debug('IAB broadcast (local)', { topic, payload }, 'IABService');
    }
  }

  /**
   * Send message to specific target
   */
  async send<T = any>(
    targetUuid: string,
    targetName: string,
    topic: string,
    payload: T
  ): Promise<void> {
    if (!this.isOpenFin) {
      logger.warn('IAB send not available in browser mode', { topic }, 'IABService');
      return;
    }

    const message: IABMessage<T> = {
      type: topic,
      payload,
      timestamp: new Date().toISOString()
    };

    try {
      const fin = (window as any).fin;
      await fin.InterApplicationBus.send({ uuid: targetUuid, name: targetName }, topic, message);
      logger.debug('IAB sent', { targetUuid, targetName, topic }, 'IABService');
    } catch (error) {
      logger.error('IAB send failed', error, 'IABService');
      throw error;
    }
  }

  /**
   * Setup OpenFin IAB subscription
   */
  private setupOpenFinSubscription(topic: string): void {
    if (!this.isOpenFin) return;

    try {
      const fin = (window as any).fin;

      // Subscribe to OpenFin IAB topic
      fin.InterApplicationBus.subscribe(
        { uuid: '*' },
        topic,
        (message: IABMessage, identity: any) => {
          logger.debug('IAB message received', { topic, message, identity }, 'IABService');
          this.handleMessage(topic, message);
        }
      );

      logger.debug('OpenFin IAB subscription setup', { topic }, 'IABService');
    } catch (error) {
      logger.error('Failed to setup OpenFin IAB subscription', error, 'IABService');
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(topic: string, message: IABMessage): void {
    const handlers = this.subscriptions.get(topic);

    if (handlers && handlers.size > 0) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          logger.error('IAB handler error', error, 'IABService');
        }
      });
    }
  }

  /**
   * Check if running in OpenFin
   */
  isInOpenFin(): boolean {
    return this.isOpenFin;
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

// Export singleton instance
export const iabService = new IABService();
