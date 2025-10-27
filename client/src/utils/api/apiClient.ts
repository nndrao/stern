/**
 * API Client
 * Configured axios instance for communicating with the backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { buildUrl } from '@/openfin/utils/openfinUtils';
import { logger } from '@/utils/logger';
import { getPlatformContext } from '@/openfin/utils/platformContext';

// API base URL resolution priority:
// 1. OpenFin platform context (manifest.platform.context.apiUrl)
// 2. Environment variable (VITE_API_URL)
// 3. Hardcoded default
const DEFAULT_API_URL = 'http://localhost:3001';

/**
 * Get API base URL from various sources
 */
async function getApiBaseUrl(): Promise<string> {
  try {
    // Try to get from platform context first (OpenFin manifest)
    const context = await getPlatformContext();
    if (context.apiUrl) {
      logger.info('Using API URL from platform context', { apiUrl: context.apiUrl }, 'apiClient');
      return context.apiUrl;
    }
  } catch (error) {
    logger.warn('Failed to get API URL from platform context', error, 'apiClient');
  }

  // Fall back to environment variable
  if (import.meta.env.VITE_API_URL) {
    logger.info('Using API URL from environment variable', { apiUrl: import.meta.env.VITE_API_URL }, 'apiClient');
    return import.meta.env.VITE_API_URL;
  }

  // Fall back to hardcoded default
  logger.info('Using default API URL', { apiUrl: DEFAULT_API_URL }, 'apiClient');
  return DEFAULT_API_URL;
}

// Initialize with default, will be updated asynchronously
let API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

/**
 * Create and configure axios instance
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Initialize API client with platform context
 * Should be called early in app initialization
 */
export async function initializeApiClient(): Promise<void> {
  try {
    const apiUrl = await getApiBaseUrl();
    API_BASE_URL = apiUrl;

    // Update axios baseURL
    apiClient.defaults.baseURL = `${apiUrl}/api/v1`;

    logger.info('API client initialized', {
      baseURL: apiClient.defaults.baseURL
    }, 'apiClient');
  } catch (error) {
    logger.error('Failed to initialize API client', error, 'apiClient');
  }
}

// Auto-initialize in OpenFin environment
if (typeof window !== 'undefined' && window.fin) {
  initializeApiClient().catch(error => {
    logger.error('Auto-initialization of API client failed', error, 'apiClient');
  });
}

/**
 * Request interceptor
 * Adds authentication token and other headers
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add user ID if available
    const userId = localStorage.getItem('user-id');
    if (userId) {
      config.headers['X-User-Id'] = userId;
    }

    // Add app ID
    config.headers['X-App-Id'] = 'stern-platform';

    // Log request in development
    if (import.meta.env.DEV) {
      logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data, 'apiClient');
    }

    return config;
  },
  (error) => {
    logger.error('Request interceptor error', error, 'apiClient');
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handles common error scenarios and logging
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      logger.debug(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data, 'apiClient');
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle specific error scenarios
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          localStorage.removeItem('auth-token');
          localStorage.removeItem('user-id');
          // In a real app, redirect to login
          logger.error('Unauthorized access - please login', undefined, 'apiClient');
          break;

        case 403:
          // Forbidden
          logger.error('Access forbidden', { message: data?.message || 'You do not have permission to access this resource' }, 'apiClient');
          break;

        case 404:
          // Not found
          logger.error('Resource not found', { message: data?.message || 'The requested resource does not exist' }, 'apiClient');
          break;

        case 422:
          // Validation error
          logger.error('Validation error', { details: data?.details || data?.message || 'Invalid data provided' }, 'apiClient');
          break;

        case 500:
          // Server error
          logger.error('Server error', { message: data?.message || 'An internal server error occurred' }, 'apiClient');
          break;

        default:
          logger.error(`API Error ${status}`, { message: data?.message || error.message }, 'apiClient');
      }
    } else if (error.request) {
      // Request was made but no response received
      logger.error('No response from server', { message: error.message }, 'apiClient');
    } else {
      // Something else happened
      logger.error('API Error', { message: error.message }, 'apiClient');
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to extract error message
 */
export function getErrorMessage(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.details) {
    if (Array.isArray(error.response.data.details)) {
      return error.response.data.details.join(', ');
    }
    return error.response.data.details;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Helper function to handle API errors
 */
export function handleApiError(error: any, defaultMessage: string = 'Operation failed'): string {
  const message = getErrorMessage(error);
  logger.error(`${defaultMessage}`, { message }, 'apiClient');
  return message;
}

/**
 * Type-safe API call wrapper
 */
export async function apiCall<T>(
  fn: () => Promise<{ data: T }>,
  defaultError: string = 'API call failed'
): Promise<T> {
  try {
    const response = await fn();
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error, defaultError));
  }
}