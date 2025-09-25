/**
 * Test setup file for Vitest
 * Configures global mocks and test environment
 */

// Mock OpenFin global
global.fin = {
  Application: {
    getCurrent: () => ({
      getManifest: async () => ({
        platform: {
          providerUrl: 'http://test.example.com/provider'
        },
        customSettings: {}
      })
    })
  }
} as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null
  };
})();

global.localStorage = localStorageMock as Storage;

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:5173',
    href: 'http://localhost:5173',
    protocol: 'http:',
    host: 'localhost:5173',
    hostname: 'localhost',
    port: '5173',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true,
  configurable: true
});