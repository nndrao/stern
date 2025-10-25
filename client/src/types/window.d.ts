/**
 * Window interface extensions
 * Extends the global Window interface with custom properties
 */

import { testApiConnection } from '@/utils/testApi';

declare global {
  interface Window {
    /**
     * Test API connection utility
     * Available in browser console for quick API testing
     */
    testApiConnection: typeof testApiConnection;
  }
}

export {};
