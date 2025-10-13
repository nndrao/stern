/**
 * STOMP Datasource Provider
 * Based on AGV3 implementation with field inference capabilities
 *
 * Features:
 * - WebSocket connection via @stomp/stompjs
 * - Snapshot/realtime data streaming
 * - Automatic field schema inference
 * - Template variable resolution
 * - Duplicate elimination via key column
 */

import { EventEmitter } from 'events';
import { Client, StompConfig, IMessage } from '@stomp/stompjs';
import { FieldInfo } from '@stern/shared-types';
import { v4 as uuidv4 } from 'uuid';

export interface StompConnectionConfig {
  websocketUrl: string;
  listenerTopic: string;
  requestMessage?: string;
  requestBody?: string;
  snapshotEndToken?: string;
  keyColumn?: string;
  messageRate?: number;
  snapshotTimeoutMs?: number;
  dataType?: 'positions' | 'trades' | 'orders' | 'custom';
  batchSize?: number;
}

export interface StompConnectionResult {
  success: boolean;
  data?: any[];
  error?: string;
}

export interface StompStatistics {
  snapshotRowsReceived: number;
  updateRowsReceived: number;
  connectionCount: number;
  disconnectionCount: number;
  isConnected: boolean;
  bytesReceived: number;
  snapshotBytesReceived: number;
  updateBytesReceived: number;
  mode: 'idle' | 'snapshot' | 'realtime';
}

export class StompDatasourceProvider extends EventEmitter {
  private client: Client | null = null;
  private config: StompConnectionConfig | null = null;
  private isConnected = false;
  private activeSubscriptions: any[] = [];
  private statistics: StompStatistics = {
    snapshotRowsReceived: 0,
    updateRowsReceived: 0,
    connectionCount: 0,
    disconnectionCount: 0,
    isConnected: false,
    bytesReceived: 0,
    snapshotBytesReceived: 0,
    updateBytesReceived: 0,
    mode: 'idle'
  };

  constructor(config?: StompConnectionConfig) {
    super();
    if (config) {
      this.config = config;
    }
  }

  /**
   * Test connection to STOMP server (without subscribing)
   */
  async checkConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      const testClient = new Client({
        brokerURL: this.config!.websocketUrl,
        reconnectDelay: 0,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (msg) => console.log('[STOMP Debug]', msg),

        onConnect: () => {
          console.log('✅ STOMP connection test successful');
          this.statistics.connectionCount++;
          testClient.deactivate();
          resolve(true);
        },

        onStompError: (frame) => {
          console.error('❌ STOMP error:', frame);
          resolve(false);
        },

        onWebSocketError: (event) => {
          console.error('❌ WebSocket error:', event);
          resolve(false);
        }
      });

      try {
        testClient.activate();

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            testClient.deactivate();
            resolve(false);
          }
        }, 10000);
      } catch (error) {
        console.error('Failed to activate test client:', error);
        resolve(false);
      }
    });
  }

  /**
   * Fetch snapshot data for field inference
   * @param maxRows Maximum number of rows to fetch
   * @param onBatch Callback for each data batch
   */
  async fetchSnapshot(
    maxRows: number = 100,
    onBatch?: (batch: any[], totalRows: number) => void
  ): Promise<StompConnectionResult> {
    return new Promise((resolve) => {
      const receivedData: any[] = [];
      const dataMap = new Map<string, any>(); // For deduplication
      let snapshotComplete = false;
      const snapshotEndToken = this.config!.snapshotEndToken || 'Success';
      const keyColumn = this.config!.keyColumn;

      const client = new Client({
        brokerURL: this.config!.websocketUrl,
        reconnectDelay: 0,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (msg) => console.log('[STOMP]', msg),

        onConnect: () => {
          console.log('✅ Connected to STOMP server for snapshot');
          this.statistics.connectionCount++;
          this.statistics.mode = 'snapshot';

          // Subscribe to listener topic
          const subscription = client.subscribe(
            this.config!.listenerTopic,
            (message: IMessage) => {
              try {
                const data = JSON.parse(message.body);
                console.log('[STOMP] Received message:', data);

                // Check for snapshot end token
                if (data.snapshotToken === snapshotEndToken || data.status === snapshotEndToken) {
                  console.log('[STOMP] Snapshot complete token received');
                  snapshotComplete = true;

                  // Clean up and resolve
                  subscription.unsubscribe();
                  client.deactivate();

                  this.statistics.mode = 'idle';
                  resolve({
                    success: true,
                    data: receivedData
                  });
                  return;
                }

                // Process data rows
                const rows = data.rows || data.data || (Array.isArray(data) ? data : [data]);

                if (rows.length > 0) {
                  // Handle deduplication if keyColumn specified
                  if (keyColumn) {
                    rows.forEach(row => {
                      const key = row[keyColumn];
                      if (key !== undefined && key !== null) {
                        dataMap.set(String(key), row);
                      } else {
                        // No key - add directly
                        receivedData.push(row);
                      }
                    });

                    // Update receivedData from Map (deduplicated data)
                    receivedData.length = 0;
                    receivedData.push(...dataMap.values());
                  } else {
                    // No deduplication - add all rows
                    receivedData.push(...rows);
                  }

                  this.statistics.snapshotRowsReceived += rows.length;
                  this.statistics.snapshotBytesReceived += message.body.length;

                  // Call batch callback
                  if (onBatch) {
                    onBatch(rows, receivedData.length);
                  }

                  console.log(`[STOMP] Received ${rows.length} rows, total (deduplicated): ${receivedData.length}`);

                  // Check if we've reached max rows
                  if (receivedData.length >= maxRows) {
                    console.log('[STOMP] Reached max rows, completing snapshot');
                    subscription.unsubscribe();
                    client.deactivate();

                    this.statistics.mode = 'idle';
                    resolve({
                      success: true,
                      data: receivedData.slice(0, maxRows)
                    });
                  }
                }
              } catch (error) {
                console.error('[STOMP] Error processing message:', error);
              }
            }
          );

          // Send snapshot request if configured
          if (this.config!.requestMessage) {
            console.log('[STOMP] Sending snapshot request:', this.config!.requestMessage);
            client.publish({
              destination: this.config!.requestMessage,
              body: this.config!.requestBody || 'START'
            });
          }
        },

        onStompError: (frame) => {
          console.error('❌ STOMP error:', frame);
          this.statistics.disconnectionCount++;
          resolve({
            success: false,
            error: frame.headers['message'] || 'STOMP error'
          });
        },

        onWebSocketError: (event) => {
          console.error('❌ WebSocket error:', event);
          this.statistics.disconnectionCount++;
          resolve({
            success: false,
            error: 'WebSocket connection failed'
          });
        },

        onDisconnect: () => {
          console.log('🔌 Disconnected from STOMP server');
          this.statistics.disconnectionCount++;

          if (!snapshotComplete) {
            resolve({
              success: receivedData.length > 0,
              data: receivedData,
              error: receivedData.length === 0 ? 'No data received' : undefined
            });
          }
        }
      });

      try {
        client.activate();

        // Timeout after configured duration
        const timeout = this.config!.snapshotTimeoutMs || 60000;
        setTimeout(() => {
          if (!snapshotComplete) {
            console.log('[STOMP] Snapshot timeout reached');
            client.deactivate();

            resolve({
              success: receivedData.length > 0,
              data: receivedData,
              error: receivedData.length === 0 ? 'Snapshot timeout - no data received' : undefined
            });
          }
        }, timeout);
      } catch (error) {
        console.error('Failed to activate STOMP client:', error);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to connect'
        });
      }
    });
  }

  /**
   * Disconnect from STOMP server
   */
  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
      this.statistics.isConnected = false;
      this.statistics.mode = 'idle';
    }
  }

  /**
   * Get current statistics
   */
  getStatistics(): StompStatistics {
    return { ...this.statistics };
  }

  /**
   * Infer field schema from data rows
   * Analyzes multiple rows to determine field types, nullability, and structure
   *
   * @param rows Array of data rows to analyze
   * @returns Record of field paths to FieldInfo
   */
  static inferFields(rows: any[]): Record<string, FieldInfo> {
    if (!rows || rows.length === 0) {
      return {};
    }

    const fields: Record<string, FieldInfo> = {};

    // Analyze each row
    rows.forEach(row => {
      this.inferObject(row, '', fields);
    });

    return fields;
  }

  /**
   * Recursively infer fields from an object
   */
  private static inferObject(
    obj: any,
    prefix: string,
    fields: Record<string, FieldInfo>
  ): void {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    Object.entries(obj).forEach(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;

      if (!fields[path]) {
        // New field - create entry
        fields[path] = {
          path,
          type: this.inferType(value),
          nullable: value === null || value === undefined,
          sample: value
        };

        // Recurse for objects
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          fields[path].children = {};
          this.inferObjectChildren(value, fields[path].children!);
        }
      } else {
        // Existing field - update nullability
        if (value === null || value === undefined) {
          fields[path].nullable = true;
        }

        // Update children if object
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          if (!fields[path].children) {
            fields[path].children = {};
          }
          this.inferObjectChildren(value, fields[path].children!);
        }
      }
    });
  }

  /**
   * Infer child fields for nested objects
   */
  private static inferObjectChildren(
    obj: any,
    children: Record<string, FieldInfo>
  ): void {
    Object.entries(obj).forEach(([key, value]) => {
      if (!children[key]) {
        children[key] = {
          path: key,
          type: this.inferType(value),
          nullable: value === null || value === undefined,
          sample: value
        };

        // Recurse for nested objects
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          children[key].children = {};
          this.inferObjectChildren(value, children[key].children!);
        }
      } else {
        // Update nullability
        if (value === null || value === undefined) {
          children[key].nullable = true;
        }

        // Update children if object
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          if (!children[key].children) {
            children[key].children = {};
          }
          this.inferObjectChildren(value, children[key].children!);
        }
      }
    });
  }

  /**
   * Infer the type of a value
   */
  private static inferType(value: any): FieldInfo['type'] {
    if (value === null || value === undefined) {
      return 'string'; // Default for null/undefined
    }

    if (Array.isArray(value)) {
      return 'array';
    }

    if (typeof value === 'boolean') {
      return 'boolean';
    }

    if (typeof value === 'number') {
      return 'number';
    }

    if (typeof value === 'object') {
      return 'object';
    }

    if (typeof value === 'string') {
      // Check if it's a date string
      if (this.isDateString(value)) {
        return 'date';
      }
      return 'string';
    }

    return 'string';
  }

  /**
   * Check if a string represents a date
   */
  private static isDateString(value: string): boolean {
    // ISO 8601 format
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return true;
    }

    // Unix timestamp (milliseconds)
    if (/^\d{13}$/.test(value)) {
      return true;
    }

    // Other common date formats can be added here
    return false;
  }
}
