/**
 * OpenFin Event Topics and Types
 *
 * Centralized enum for all OpenFin IAB custom events and platform/workspace events.
 * This ensures type-safety and consistency across the application.
 */

// ============================================================================
// IAB Custom Event Topics
// ============================================================================

/**
 * OpenFin Inter-Application Bus (IAB) Custom Event Topics
 * These are application-specific events broadcasted via IAB
 */
export enum OpenFinCustomEvents {
  /**
   * Theme change event
   * Broadcast when user changes theme from dock
   */
  THEME_CHANGE = 'stern-platform:theme-change',

  /**
   * Configuration updated event
   * Broadcast when any configuration is saved/updated
   */
  CONFIG_UPDATED = 'stern-platform:config-updated',

  /**
   * Data refresh event
   * Broadcast when data needs to be refreshed across all views
   */
  DATA_REFRESH = 'stern-platform:data-refresh',

  /**
   * Blotter update event
   * Broadcast when blotter data updates
   */
  BLOTTER_UPDATE = 'stern-platform:blotter-update',

  /**
   * Provider connection status change
   * Broadcast when data provider connects/disconnects
   */
  PROVIDER_STATUS = 'stern-platform:provider-status',
}

// ============================================================================
// OpenFin Platform/Workspace Native Events
// ============================================================================

/**
 * OpenFin Platform/Workspace Native Event Topics
 * These are built-in OpenFin events from the platform/workspace APIs
 */
export enum OpenFinPlatformEvents {
  WORKSPACE_SAVED = 'workspace-saved',
  WORKSPACE_LOADED = 'workspace-loaded',
  VIEW_CLOSED = 'view-closed',
  VIEW_FOCUSED = 'view-focused',
  VIEW_BLURRED = 'view-blurred',
  WINDOW_CLOSED = 'window-closed',
  WINDOW_FOCUSED = 'window-focused',
  PAGE_CHANGED = 'page-changed',
  LAYOUT_READY = 'layout-ready',
}

// ============================================================================
// Event Payload Type Definitions
// ============================================================================

/**
 * Theme change event payload
 */
export interface ThemeChangeEvent {
  theme: 'light' | 'dark';
}

/**
 * Configuration updated event payload
 */
export interface ConfigUpdatedEvent {
  configId: string;
  componentType: string;
  componentSubType?: string;
  timestamp: number;
}

/**
 * Data refresh event payload
 */
export interface DataRefreshEvent {
  source: string;
  timestamp: number;
}

/**
 * Blotter update event payload
 */
export interface BlotterUpdateEvent {
  blotterId: string;
  updateType: 'insert' | 'update' | 'delete';
  rowCount: number;
}

/**
 * Provider status event payload
 */
export interface ProviderStatusEvent {
  providerId: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  message?: string;
}

// ============================================================================
// Type-Safe Event Map
// ============================================================================

/**
 * Maps event topics to their payload types
 * This ensures type-safety when using the event system
 */
export interface OpenFinEventMap {
  [OpenFinCustomEvents.THEME_CHANGE]: ThemeChangeEvent;
  [OpenFinCustomEvents.CONFIG_UPDATED]: ConfigUpdatedEvent;
  [OpenFinCustomEvents.DATA_REFRESH]: DataRefreshEvent;
  [OpenFinCustomEvents.BLOTTER_UPDATE]: BlotterUpdateEvent;
  [OpenFinCustomEvents.PROVIDER_STATUS]: ProviderStatusEvent;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Union type of all custom event topics
 */
export type OpenFinCustomEventTopic = keyof OpenFinEventMap;

/**
 * Generic event handler function type
 */
export type OpenFinEventHandler<E extends OpenFinCustomEventTopic> = (
  data: OpenFinEventMap[E]
) => void;

/**
 * Unsubscribe function type
 */
export type UnsubscribeFunction = () => void;
