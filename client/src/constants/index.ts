/**
 * Application Constants
 * Centralized location for all magic numbers and configuration values
 */

// === Timing Constants ===
export const TIMING = {
  /** Auto-save draft interval in milliseconds (30 seconds) */
  AUTO_SAVE_DRAFT_MS: 30000,

  /** Delay for workspace API initialization (500ms) */
  WORKSPACE_INIT_DELAY_MS: 500,

  /** Default API request timeout (30 seconds) */
  API_TIMEOUT_MS: 30000,

  /** Toast notification default duration (5 seconds) */
  TOAST_DURATION_MS: 5000,

  /** Debounce delay for search inputs (300ms) */
  SEARCH_DEBOUNCE_MS: 300,

  /** Polling interval for health checks (60 seconds) */
  HEALTH_CHECK_INTERVAL_MS: 60000,
} as const;

// === Rate Limiting Constants ===
export const RATE_LIMITING = {
  /** Rate limit window in milliseconds (15 minutes) */
  WINDOW_MS: 15 * 60 * 1000,

  /** Maximum requests per window in production */
  MAX_REQUESTS_PROD: 100,

  /** Maximum requests per window in development */
  MAX_REQUESTS_DEV: 1000,
} as const;

// === Data Size Limits ===
export const LIMITS = {
  /** Maximum API request body size */
  MAX_BODY_SIZE: '10mb',

  /** Maximum file upload size (10 MB) */
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,

  /** Maximum number of logs to store in memory */
  MAX_LOGS: 1000,

  /** Maximum number of items to display per page */
  MAX_PAGE_SIZE: 100,

  /** Default page size for pagination */
  DEFAULT_PAGE_SIZE: 50,

  /** Maximum bulk operation batch size */
  MAX_BULK_OPERATIONS: 50,

  /** Maximum menu depth for dock configuration */
  MAX_MENU_DEPTH: 3,

  /** Maximum menu items per parent */
  MAX_MENU_ITEMS: 20,
} as const;

// === Local Storage Keys ===
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token',
  USER_ID: 'user-id',
  DOCK_CONFIG_DRAFT: 'dock-config-draft',
  THEME: 'stern-theme',
  USER_PREFERENCES: 'user-preferences',
  RECENT_CONFIGS: 'recent-configs',
} as const;

// === Application Metadata ===
export const APP_INFO = {
  ID: 'stern-platform',
  NAME: 'Stern Trading Platform',
  VERSION: '0.0.1',
  DESCRIPTION: 'Unified configurable trading platform',
} as const;

// === API Configuration ===
export const API = {
  VERSION: 'v1',
  BASE_PATH: '/api/v1',
  ENDPOINTS: {
    HEALTH: '/health',
    CONFIGURATIONS: '/configurations',
    CONFIG_BY_ID: (id: string) => `/configurations/${id}`,
    CONFIG_BY_USER: (userId: string) => `/configurations/by-user/${userId}`,
    CONFIG_BY_APP: (appId: string) => `/configurations/by-app/${appId}`,
    CONFIG_CLONE: (id: string) => `/configurations/${id}/clone`,
  },
} as const;

// === Validation Rules ===
export const VALIDATION = {
  /** Minimum configuration name length */
  MIN_NAME_LENGTH: 3,

  /** Maximum configuration name length */
  MAX_NAME_LENGTH: 100,

  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 500,

  /** Maximum tags per configuration */
  MAX_TAGS: 10,

  /** URL pattern for validation */
  URL_PATTERN: /^https?:\/\/.+$/,

  /** UUID pattern for validation */
  UUID_PATTERN: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

// === Component Types ===
export const COMPONENT_TYPE = {
  DATASOURCE: 'datasource',
  GRID: 'grid',
  DATA_GRID: 'data-grid',
  PROFILE: 'profile',
  WORKSPACE: 'workspace',
  THEME: 'theme',
  LAYOUT: 'layout',
  DOCK: 'dock',
} as const;

// === HTTP Status Codes ===
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// === Error Messages ===
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error - please check your connection',
  UNAUTHORIZED: 'Unauthorized - please login again',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  VALIDATION_ERROR: 'Validation failed - please check your input',
  SERVER_ERROR: 'An internal server error occurred',
  TIMEOUT: 'Request timed out - please try again',
  GENERIC: 'An unexpected error occurred',
} as const;

// === Log Levels ===
export const LOG_LEVEL = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;

// === Environment ===
// Note: API URL resolution priority:
// 1. OpenFin platform context (manifest.platform.context.apiUrl) - checked at runtime
// 2. Environment variable (VITE_API_URL) - checked here
// 3. Hardcoded default - http://localhost:3001
export const ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
} as const;

// Type exports for better TypeScript support
export type TimingKey = keyof typeof TIMING;
export type StorageKey = keyof typeof STORAGE_KEYS;
export type ComponentType = typeof COMPONENT_TYPE[keyof typeof COMPONENT_TYPE];
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export type LogLevel = typeof LOG_LEVEL[keyof typeof LOG_LEVEL];
