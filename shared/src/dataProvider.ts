// DataProvider configuration types for Stern Trading Platform
// These configs are stored as UnifiedConfig with componentType='datasource'

/**
 * Provider type enumeration (lowercase - used in frontend)
 */
export const PROVIDER_TYPES = {
  STOMP: 'stomp',
  REST: 'rest',
  WEBSOCKET: 'websocket',
  SOCKETIO: 'socketio',
  MOCK: 'mock',
  APPDATA: 'appdata'
} as const;

export type ProviderType = typeof PROVIDER_TYPES[keyof typeof PROVIDER_TYPES];

/**
 * Provider type to ComponentSubType mapping
 * Maps lowercase frontend provider types to capitalized backend componentSubTypes
 */
export const PROVIDER_TYPE_TO_COMPONENT_SUBTYPE: Record<ProviderType, string> = {
  [PROVIDER_TYPES.STOMP]: 'Stomp',
  [PROVIDER_TYPES.REST]: 'Rest',
  [PROVIDER_TYPES.WEBSOCKET]: 'WebSocket',
  [PROVIDER_TYPES.SOCKETIO]: 'SocketIO',
  [PROVIDER_TYPES.MOCK]: 'Mock',
  [PROVIDER_TYPES.APPDATA]: 'AppData'
};

/**
 * ComponentSubType to Provider type mapping
 * Maps capitalized backend componentSubTypes to lowercase frontend provider types
 */
export const COMPONENT_SUBTYPE_TO_PROVIDER_TYPE: Record<string, ProviderType> = {
  'Stomp': PROVIDER_TYPES.STOMP,
  'Rest': PROVIDER_TYPES.REST,
  'WebSocket': PROVIDER_TYPES.WEBSOCKET,
  'SocketIO': PROVIDER_TYPES.SOCKETIO,
  'Mock': PROVIDER_TYPES.MOCK,
  'AppData': PROVIDER_TYPES.APPDATA,
  // Lowercase fallbacks for backward compatibility
  'stomp': PROVIDER_TYPES.STOMP,
  'rest': PROVIDER_TYPES.REST,
  'websocket': PROVIDER_TYPES.WEBSOCKET,
  'socketio': PROVIDER_TYPES.SOCKETIO,
  'mock': PROVIDER_TYPES.MOCK,
  'appdata': PROVIDER_TYPES.APPDATA
};

/**
 * Connection state enumeration
 */
export const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
} as const;

export type ConnectionState = typeof CONNECTION_STATES[keyof typeof CONNECTION_STATES];

/**
 * Field information from schema inference
 */
export interface FieldInfo {
  path: string;                   // Full dot-notation path (e.g., 'user.address.city')
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  nullable: boolean;
  sample?: any;                   // Sample value
  children?: Record<string, FieldInfo>; // For object/array types
}

/**
 * Column definition for AG-Grid
 */
export interface ColumnDefinition {
  field: string;                  // Field path
  headerName: string;             // Display name
  cellDataType?: 'text' | 'number' | 'boolean' | 'date' | 'dateString' | 'object';
  width?: number;
  filter?: string | boolean;
  sortable?: boolean;
  resizable?: boolean;
  hide?: boolean;
  type?: string;
  valueFormatter?: string;        // Formatter ID or pattern
  cellRenderer?: string;          // Renderer component name
}

/**
 * STOMP Provider Configuration
 * For real-time data streaming via STOMP WebSocket protocol
 */
export interface StompProviderConfig {
  providerType: 'stomp';
  websocketUrl: string;           // WebSocket URL (e.g., 'ws://localhost:8080/stomp')
  listenerTopic: string;          // Topic to subscribe to
  requestMessage?: string;        // Topic to send snapshot request
  requestBody?: string;           // Body of snapshot request (default: 'START')
  snapshotEndToken?: string;      // Token indicating end of snapshot (default: 'Success')
  keyColumn?: string;             // Key field for row identification
  snapshotTimeoutMs?: number;     // Snapshot timeout (default: 60000ms)
  manualTopics?: boolean;         // Enable manual topic configuration (default: false)

  // Auto-generation parameters (when manualTopics is false)
  dataType?: 'positions' | 'trades' | 'orders' | 'custom'; // Data type preset
  messageRate?: number;           // Message rate in messages/second (default: 1000)
  batchSize?: number;             // Batch size for snapshot (optional)

  // Advanced settings
  autoStart?: boolean;            // Auto-start on load (default: false)
  heartbeat?: {
    outgoing?: number;            // Outgoing heartbeat interval (ms)
    incoming?: number;            // Incoming heartbeat interval (ms)
  };

  // Inferred schema and column configuration
  inferredFields?: FieldInfo[];   // Fields inferred from data
  columnDefinitions?: ColumnDefinition[]; // AG-Grid column definitions
}

/**
 * REST Provider Configuration
 * For polling-based data from REST APIs
 */
export interface RestProviderConfig {
  providerType: 'rest';
  baseUrl: string;                // Base URL (e.g., 'https://api.example.com')
  endpoint: string;               // Endpoint path (e.g., '/v1/positions')
  method: 'GET' | 'POST';         // HTTP method
  queryParams?: Record<string, string>; // Query string parameters (e.g., {symbol: 'AAPL', limit: '100'})
  body?: string;                  // Request body for POST/PUT (JSON string)
  headers?: Record<string, string>; // Custom headers
  pollInterval?: number;          // Polling interval in ms (default: 5000)
  paginationMode?: 'offset' | 'cursor' | 'page'; // Pagination strategy
  pageSize?: number;              // Records per page
  auth?: {
    type: 'bearer' | 'apikey' | 'basic';
    credentials: string;          // Token, API key, or base64 credentials
    headerName?: string;          // Custom header name for API key
  };
  timeout?: number;               // Request timeout (ms)
}

/**
 * WebSocket Provider Configuration
 * For vanilla WebSocket connections
 */
export interface WebSocketProviderConfig {
  providerType: 'websocket';
  url: string;                    // WebSocket URL
  protocol?: string;              // WebSocket sub-protocol
  messageFormat: 'json' | 'binary' | 'text'; // Message format
  heartbeatInterval?: number;     // Heartbeat interval (ms)
  reconnectAttempts?: number;     // Max reconnection attempts
  reconnectDelay?: number;        // Delay between reconnection attempts (ms)
}

/**
 * Socket.IO Provider Configuration
 * For Socket.IO connections
 */
export interface SocketIOProviderConfig {
  providerType: 'socketio';
  url: string;                    // Socket.IO server URL
  namespace?: string;             // Socket.IO namespace (default: '/')
  events: {
    snapshot: string;             // Event name for snapshot data
    update: string;               // Event name for updates
    delete?: string;              // Event name for deletions
  };
  rooms?: string[];               // Socket.IO rooms to join
  auth?: any;                     // Authentication data
  reconnection?: boolean;         // Auto-reconnect (default: true)
  reconnectionDelay?: number;     // Delay between reconnections (ms)
}

/**
 * Mock Provider Configuration
 * For testing with simulated data
 */
export interface MockProviderConfig {
  providerType: 'mock';
  dataType: 'positions' | 'trades' | 'orders' | 'custom';
  updateInterval?: number;        // Update frequency in ms (default: 2000)
  rowCount?: number;              // Number of mock rows (default: 20)
  enableUpdates?: boolean;        // Enable real-time updates (default: true)
  customData?: any[];             // Custom mock data
}

/**
 * AppData Variable
 * Represents a single variable in an AppData provider
 */
export interface AppDataVariable {
  key: string;                    // Variable name
  value: string | number | boolean | object;  // Scalar or JSON value
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;           // Optional documentation
  sensitive?: boolean;            // Hide value in UI (e.g., tokens, passwords)
}

/**
 * AppData Provider Configuration
 * For global application variables shared across all windows/views
 * Accessed using template syntax: {AppData.ProviderName.variableName}
 */
export interface AppDataProviderConfig {
  providerType: 'appdata';
  variables: Record<string, AppDataVariable>;  // Key-value pairs
}

/**
 * Union type for all provider configurations
 */
export type ProviderConfig =
  | StompProviderConfig
  | RestProviderConfig
  | WebSocketProviderConfig
  | SocketIOProviderConfig
  | MockProviderConfig
  | AppDataProviderConfig;

/**
 * Provider capabilities
 * Describes what features a provider supports
 */
export interface ProviderCapabilities {
  hasSnapshot: boolean;           // Supports initial bulk load
  hasRealtime: boolean;           // Supports real-time updates
  hasPagination: boolean;         // Supports pagination
  hasFiltering: boolean;          // Supports server-side filtering
  hasSorting: boolean;            // Supports server-side sorting
  hasSearch: boolean;             // Supports server-side search
  maxRowsPerRequest?: number;     // Maximum rows per request
}

/**
 * Provider statistics for monitoring
 */
export interface ProviderStatistics {
  snapshotRowsReceived: number;
  updateRowsReceived: number;
  bytesReceived: number;
  snapshotBytesReceived: number;
  updateBytesReceived: number;
  connectionCount: number;
  disconnectionCount: number;
  isConnected: boolean;
  mode: 'idle' | 'snapshot' | 'realtime';
  lastMessageTime: number | null;
  connectionDuration?: number;
  errorCount?: number;
}

/**
 * Template variables available for STOMP topic resolution
 */
export interface TemplateVariables {
  clientId: string;               // Unique session ID
  userId?: string;                // User identifier
  timestamp?: number;             // Current timestamp
  [key: string]: string | number | undefined; // Additional custom variables
}

/**
 * DataProvider configuration wrapper
 * This is the main interface for creating/editing providers
 * It gets stored as UnifiedConfig with componentType='datasource'
 */
export interface DataProviderConfig {
  providerId?: string;            // Optional for new providers (generated as configId)
  name: string;                   // Display name
  description?: string;           // Optional description
  providerType: ProviderType;     // Type of provider
  config: ProviderConfig;         // Type-specific configuration
  tags?: string[];                // Searchable tags
  isDefault?: boolean;            // Default provider for new blotters
  userId: string;                 // Owner user ID
}

/**
 * Validation result for provider configurations
 */
export interface ProviderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Provider connection test result
 */
export interface ProviderTestResult {
  success: boolean;
  connectionState: ConnectionState;
  responseTime?: number;          // Time to connect (ms)
  error?: string;                 // Error message if failed
  metadata?: {
    serverVersion?: string;
    capabilities?: ProviderCapabilities;
    sampleData?: any[];           // Sample data if available
  };
}

/**
 * Default provider configurations for quick setup
 */
export const DEFAULT_PROVIDER_CONFIGS: Record<ProviderType, Partial<ProviderConfig>> = {
  stomp: {
    providerType: 'stomp',
    listenerTopic: '',
    websocketUrl: '',
    snapshotEndToken: 'Success',
    requestBody: 'START',
    snapshotTimeoutMs: 60000,
    manualTopics: false,
    dataType: 'positions',
    messageRate: 1000,
    autoStart: false,
    heartbeat: {
      outgoing: 4000,
      incoming: 4000
    },
    inferredFields: [],
    columnDefinitions: []
  },
  rest: {
    providerType: 'rest',
    method: 'GET',
    pollInterval: 5000,
    pageSize: 100,
    timeout: 30000
  },
  websocket: {
    providerType: 'websocket',
    messageFormat: 'json',
    heartbeatInterval: 30000,
    reconnectAttempts: 5,
    reconnectDelay: 5000
  },
  socketio: {
    providerType: 'socketio',
    namespace: '/',
    reconnection: true,
    reconnectionDelay: 5000
  },
  mock: {
    providerType: 'mock',
    dataType: 'positions',
    updateInterval: 2000,
    rowCount: 20,
    enableUpdates: true
  },
  appdata: {
    providerType: 'appdata',
    variables: {}
  }
};

/**
 * Helper function to get default config for a provider type
 */
export function getDefaultProviderConfig(type: ProviderType): Partial<ProviderConfig> {
  return { ...DEFAULT_PROVIDER_CONFIGS[type] };
}

/**
 * Validate provider configuration
 * Simplified validation - only checks provider type exists
 * Detailed validation happens at runtime when provider is used
 */
export function validateProviderConfig(config: ProviderConfig): ProviderValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Only validate that provider type exists
  if (!config.providerType) {
    errors.push('Provider type is required');
  }

  // Optional warnings for common issues (non-blocking)
  switch (config.providerType) {
    case 'stomp': {
      const stompConfig = config as StompProviderConfig;
      if (stompConfig.websocketUrl && !stompConfig.websocketUrl.startsWith('ws://') && !stompConfig.websocketUrl.startsWith('wss://')) {
        warnings.push('WebSocket URL should typically start with ws:// or wss://');
      }
      if (stompConfig.snapshotTimeoutMs && stompConfig.snapshotTimeoutMs < 1000) {
        warnings.push('Snapshot timeout is very low (< 1 second)');
      }
      break;
    }

    case 'rest': {
      const restConfig = config as RestProviderConfig;
      if (restConfig.baseUrl && !restConfig.baseUrl.startsWith('http://') && !restConfig.baseUrl.startsWith('https://')) {
        warnings.push('Base URL should typically start with http:// or https://');
      }
      if (restConfig.pollInterval && restConfig.pollInterval < 1000) {
        warnings.push('Poll interval is very low (< 1 second), may cause high server load');
      }
      break;
    }

    case 'websocket': {
      const wsConfig = config as WebSocketProviderConfig;
      if (wsConfig.url && !wsConfig.url.startsWith('ws://') && !wsConfig.url.startsWith('wss://')) {
        warnings.push('URL should typically start with ws:// or wss://');
      }
      break;
    }

    case 'socketio': {
      // No warnings for Socket.IO
      break;
    }

    case 'mock': {
      // No warnings for Mock
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}
