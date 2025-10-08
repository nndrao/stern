/**
 * IDataProvider Interface
 *
 * Unified interface for all data providers (STOMP, Socket.IO, WebSocket, REST)
 * Supports multiple subscription types and real-time updates
 */

export type DataProviderStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SubscriptionOptions {
  topic: string;
  filters?: Record<string, any>;
  throttleMs?: number;
  onData: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface ConnectionConfig {
  url: string;
  protocol: 'stomp' | 'socketio' | 'websocket' | 'rest';
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };
  reconnect?: boolean;
  reconnectDelay?: number;
  heartbeat?: {
    outgoing?: number;
    incoming?: number;
  };
}

export interface DataProviderMetrics {
  messageCount: number;
  errorCount: number;
  lastMessageTime?: Date;
  averageLatency?: number;
  connectionUptime?: number;
}

/**
 * Unified Data Provider Interface
 */
export interface IDataProvider {
  /**
   * Connect to the data source
   */
  connect(config: ConnectionConfig): Promise<void>;

  /**
   * Disconnect from the data source
   */
  disconnect(): Promise<void>;

  /**
   * Subscribe to a topic/channel
   * Returns subscription ID for later unsubscribe
   */
  subscribe(options: SubscriptionOptions): string;

  /**
   * Unsubscribe from a topic using subscription ID
   */
  unsubscribe(subscriptionId: string): void;

  /**
   * Get current connection status
   */
  getStatus(): DataProviderStatus;

  /**
   * Add status change listener
   * Returns function to remove listener
   */
  onStatusChange(callback: (status: DataProviderStatus) => void): () => void;

  /**
   * Send message to server (if protocol supports it)
   */
  send(topic: string, message: any): Promise<void>;

  /**
   * Get provider metrics
   */
  getMetrics(): DataProviderMetrics;

  /**
   * Check if provider is connected
   */
  isConnected(): boolean;

  /**
   * Get list of active subscriptions
   */
  getActiveSubscriptions(): string[];
}

/**
 * Abstract base class for data providers
 */
export abstract class BaseDataProvider implements IDataProvider {
  protected status: DataProviderStatus = 'disconnected';
  protected subscriptions: Map<string, SubscriptionOptions> = new Map();
  protected statusListeners: Set<(status: DataProviderStatus) => void> = new Set();
  protected metrics: DataProviderMetrics = {
    messageCount: 0,
    errorCount: 0
  };

  abstract connect(config: ConnectionConfig): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract subscribe(options: SubscriptionOptions): string;
  abstract unsubscribe(subscriptionId: string): void;
  abstract send(topic: string, message: any): Promise<void>;

  getStatus(): DataProviderStatus {
    return this.status;
  }

  onStatusChange(callback: (status: DataProviderStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  getMetrics(): DataProviderMetrics {
    return { ...this.metrics };
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  protected setStatus(status: DataProviderStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statusListeners.forEach(listener => listener(status));
    }
  }

  protected incrementMessageCount(): void {
    this.metrics.messageCount++;
    this.metrics.lastMessageTime = new Date();
  }

  protected incrementErrorCount(): void {
    this.metrics.errorCount++;
  }

  protected generateSubscriptionId(): string {
    return `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
