/**
 * Simple API test utility
 */

import { apiClient } from './apiClient';
import { logger } from '@/utils/logger';

export async function testApiConnection() {
  try {
    logger.info('Testing API connection to', { baseURL: apiClient.defaults.baseURL }, 'testApi');

    // Test health endpoint
    const healthResponse = await apiClient.get('/health');
    logger.info('Health check', healthResponse.data, 'testApi');

    // Test configurations endpoint
    const configResponse = await apiClient.get('/configurations/by-user/test-user');
    logger.info('Configuration response', configResponse.data, 'testApi');

    return { success: true, message: 'API connection successful' };
  } catch (error: unknown) {
    logger.error('API connection failed', error, 'testApi');
    const message = error instanceof Error ? error.message : 'API connection failed';
    const details = (error && typeof error === 'object' && 'response' in error)
      ? (error as { response?: { data?: unknown }; code?: string }).response?.data || (error as { code?: string }).code
      : undefined;
    return {
      success: false,
      message,
      details
    };
  }
}

// Add to window for easy browser console testing
if (typeof window !== 'undefined') {
  window.testApiConnection = testApiConnection;
}