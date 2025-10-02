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
  } catch (error: any) {
    logger.error('API connection failed', error, 'testApi');
    return {
      success: false,
      message: error.message,
      details: error.response?.data || error.code
    };
  }
}

// Add to window for easy browser console testing
if (typeof window !== 'undefined') {
  (window as any).testApiConnection = testApiConnection;
}