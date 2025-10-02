// Core UnifiedConfig schema and related types for Stern Configuration Service

export interface UnifiedConfig {
  // === Identity ===
  configId: string;           // Unique identifier (UUID)
  appId: string;              // Application identifier
  userId: string;             // User who owns this config

  // === Component Classification ===
  componentType: string;      // 'datasource' | 'grid' | 'profile' | 'workspace' | 'theme' | 'layout'
  componentSubType?: string;  // 'stomp' | 'rest' | 'default' | 'custom' | 'shared' | 'direct'

  // === Display ===
  name: string;               // User-friendly name
  description?: string;       // Optional description
  icon?: string;              // Optional icon identifier

  // === Configuration Data ===
  config: Record<string, unknown>;  // Component-specific current configuration (strongly typed)
  settings: ConfigVersion[];        // Version history (profiles, themes, layouts, views, etc.)
  activeSetting: string;            // ID of active version

  // === Metadata ===
  tags?: string[];            // Searchable tags
  category?: string;          // Organizational category
  isShared?: boolean;         // Shared with other users
  isDefault?: boolean;        // System default
  isLocked?: boolean;         // Prevent modifications

  // === Audit ===
  createdBy: string;          // User ID who created
  lastUpdatedBy: string;      // User ID who last updated
  creationTime: Date;         // ISO timestamp
  lastUpdated: Date;          // ISO timestamp

  // === Soft Delete ===
  deletedAt?: Date | null;    // Soft delete timestamp
  deletedBy?: string | null;  // User who deleted
}

export interface ConfigVersion {
  versionId: string;          // Unique version identifier (UUID)
  name: string;               // Version name (e.g., "Default", "Trading View", "Dark Theme")
  description?: string;       // Optional version description
  config: Record<string, unknown>;  // Version-specific configuration data (strongly typed)
  createdTime: Date;          // Version creation timestamp
  updatedTime: Date;          // Version last update timestamp
  isActive: boolean;          // Whether this version is currently active
  metadata?: Record<string, unknown>;  // Version-specific metadata (strongly typed)
}

export interface ConfigurationFilter {
  // Identity Filters
  configIds?: string[];           // Multiple config IDs
  appIds?: string[];              // Multiple app IDs
  userIds?: string[];             // Multiple user IDs

  // Component Classification Filters
  componentTypes?: string[];      // Multiple component types
  componentSubTypes?: string[];   // Multiple component subtypes

  // Content Filters
  nameContains?: string;          // Name contains text
  descriptionContains?: string;   // Description contains text
  tags?: string[];                // Must have all specified tags
  categories?: string[];          // Multiple categories

  // Boolean Filters
  isShared?: boolean;             // Shared configurations
  isDefault?: boolean;            // Default configurations
  isLocked?: boolean;             // Locked configurations
  includeDeleted?: boolean;       // Include soft-deleted records

  // Date Range Filters
  createdAfter?: Date;            // Created after date
  createdBefore?: Date;           // Created before date
  updatedAfter?: Date;            // Updated after date
  updatedBefore?: Date;           // Updated before date

  // Advanced Filters
  hasVersions?: boolean;          // Has versions in settings array
  activeSettingExists?: boolean;  // Has valid activeSetting reference
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface StorageHealthStatus {
  isHealthy: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastChecked: Date;
  responseTime: number;
  errorMessage?: string;
  storageType: 'sqlite' | 'mongodb' | 'mock';
}

export interface BulkUpdateRequest {
  configId: string;
  updates: Partial<UnifiedConfig>;
}

export interface BulkUpdateResult {
  configId: string;
  success: boolean;
  error?: string;
}

export interface CleanupResult {
  removedCount: number;
  configs?: UnifiedConfig[] | undefined;
  dryRun?: boolean;
}

// Component type constants
export const COMPONENT_TYPES = {
  DATASOURCE: 'datasource',
  GRID: 'grid',
  DATA_GRID: 'data-grid',
  PROFILE: 'profile',
  WORKSPACE: 'workspace',
  THEME: 'theme',
  LAYOUT: 'layout',
  DOCK: 'dock'
} as const;

export const COMPONENT_SUBTYPES = {
  STOMP: 'stomp',
  WEBSOCKET: 'websocket',
  SOCKETIO: 'socketio',
  REST: 'rest',
  DEFAULT: 'default',
  CUSTOM: 'custom',
  SHARED: 'shared',
  DIRECT: 'direct'
} as const;

export type ComponentType = typeof COMPONENT_TYPES[keyof typeof COMPONENT_TYPES];
export type ComponentSubType = typeof COMPONENT_SUBTYPES[keyof typeof COMPONENT_SUBTYPES];
