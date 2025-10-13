/**
 * DataProvider Store (Zustand)
 *
 * State management for DataProvider configurations
 * Handles CRUD operations, undo/redo, and validation
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  DataProviderConfig,
  ProviderType,
  validateProviderConfig,
  ProviderValidationResult
} from '@stern/shared-types';
import { dataProviderConfigService } from '@/services/dataProviderConfigService';
import { logger } from '@/utils/logger';

interface DataProviderState {
  // Data
  providers: DataProviderConfig[];
  currentProvider: DataProviderConfig | null;
  selectedProviderId: string | null;

  // UI State
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isDirty: boolean;

  // Validation
  validationResult: ProviderValidationResult | null;

  // Undo/Redo
  history: DataProviderConfig[];
  historyIndex: number;

  // Actions
  loadProviders: (userId: string) => Promise<void>;
  loadProvider: (providerId: string) => Promise<void>;
  createProvider: (provider: DataProviderConfig, userId: string) => Promise<void>;
  updateProvider: (providerId: string, updates: Partial<DataProviderConfig>, userId: string) => Promise<void>;
  deleteProvider: (providerId: string) => Promise<void>;
  cloneProvider: (providerId: string, newName: string, userId: string) => Promise<void>;
  setDefault: (providerId: string, userId: string) => Promise<void>;
  searchProviders: (query: string, userId: string) => Promise<void>;

  // Local state management
  setCurrentProvider: (provider: DataProviderConfig | null) => void;
  updateCurrentProvider: (updates: Partial<DataProviderConfig>) => void;
  validateCurrentProvider: () => void;
  selectProvider: (providerId: string | null) => void;
  clearError: () => void;
  setDirty: (dirty: boolean) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: (provider: DataProviderConfig) => void;
  clearHistory: () => void;

  // Reset
  reset: () => void;
}

export const useDataProviderStore = create<DataProviderState>()(
  immer((set, get) => ({
    // Initial state
    providers: [],
    currentProvider: null,
    selectedProviderId: null,
    isLoading: false,
    isSaving: false,
    error: null,
    isDirty: false,
    validationResult: null,
    history: [],
    historyIndex: -1,

    // Load all providers for a user
    loadProviders: async (userId: string) => {
      set({ isLoading: true, error: null });

      try {
        logger.info('Loading data providers', { userId }, 'DataProviderStore');

        const providers = await dataProviderConfigService.getByUser(userId);

        set({
          providers,
          isLoading: false
        });

        logger.info('Data providers loaded', { count: providers.length }, 'DataProviderStore');
      } catch (error: any) {
        logger.error('Failed to load data providers', error, 'DataProviderStore');

        set({
          error: error.message || 'Failed to load data providers',
          isLoading: false
        });
      }
    },

    // Load a specific provider
    loadProvider: async (providerId: string) => {
      set({ isLoading: true, error: null });

      try {
        logger.info('Loading data provider', { providerId }, 'DataProviderStore');

        const provider = await dataProviderConfigService.getById(providerId);

        if (provider) {
          set({
            currentProvider: provider,
            selectedProviderId: providerId,
            isLoading: false,
            isDirty: false
          });

          // Validate loaded provider
          get().validateCurrentProvider();

          logger.info('Data provider loaded', { providerId }, 'DataProviderStore');
        } else {
          set({
            error: 'Provider not found',
            isLoading: false
          });
        }
      } catch (error: any) {
        logger.error('Failed to load data provider', error, 'DataProviderStore');

        set({
          error: error.message || 'Failed to load data provider',
          isLoading: false
        });
      }
    },

    // Create a new provider
    createProvider: async (provider: DataProviderConfig, userId: string) => {
      set({ isSaving: true, error: null });

      try {
        logger.info('Creating data provider', { name: provider.name }, 'DataProviderStore');

        const created = await dataProviderConfigService.create(provider, userId);

        set(state => {
          state.providers.push(created);
          state.currentProvider = created;
          state.selectedProviderId = created.providerId!;
          state.isSaving = false;
          state.isDirty = false;
        });

        logger.info('Data provider created', { providerId: created.providerId }, 'DataProviderStore');
      } catch (error: any) {
        logger.error('Failed to create data provider', error, 'DataProviderStore');

        set({
          error: error.message || 'Failed to create data provider',
          isSaving: false
        });

        throw error;
      }
    },

    // Update an existing provider
    updateProvider: async (providerId: string, updates: Partial<DataProviderConfig>, userId: string) => {
      set({ isSaving: true, error: null });

      try {
        logger.info('Updating data provider', { providerId }, 'DataProviderStore');

        const updated = await dataProviderConfigService.update(providerId, updates, userId);

        set(state => {
          const index = state.providers.findIndex(p => p.providerId === providerId);
          if (index !== -1) {
            state.providers[index] = updated;
          }

          if (state.currentProvider?.providerId === providerId) {
            state.currentProvider = updated;
          }

          state.isSaving = false;
          state.isDirty = false;
        });

        logger.info('Data provider updated', { providerId }, 'DataProviderStore');
      } catch (error: any) {
        logger.error('Failed to update data provider', error, 'DataProviderStore');

        set({
          error: error.message || 'Failed to update data provider',
          isSaving: false
        });

        throw error;
      }
    },

    // Delete a provider
    deleteProvider: async (providerId: string) => {
      set({ isSaving: true, error: null });

      try {
        logger.info('Deleting data provider', { providerId }, 'DataProviderStore');

        await dataProviderConfigService.delete(providerId);

        set(state => {
          state.providers = state.providers.filter(p => p.providerId !== providerId);

          if (state.currentProvider?.providerId === providerId) {
            state.currentProvider = null;
            state.selectedProviderId = null;
          }

          state.isSaving = false;
        });

        logger.info('Data provider deleted', { providerId }, 'DataProviderStore');
      } catch (error: any) {
        logger.error('Failed to delete data provider', error, 'DataProviderStore');

        set({
          error: error.message || 'Failed to delete data provider',
          isSaving: false
        });

        throw error;
      }
    },

    // Clone a provider
    cloneProvider: async (providerId: string, newName: string, userId: string) => {
      set({ isSaving: true, error: null });

      try {
        logger.info('Cloning data provider', { providerId, newName }, 'DataProviderStore');

        const cloned = await dataProviderConfigService.clone(providerId, newName, userId);

        set(state => {
          state.providers.push(cloned);
          state.currentProvider = cloned;
          state.selectedProviderId = cloned.providerId!;
          state.isSaving = false;
        });

        logger.info('Data provider cloned', { newId: cloned.providerId }, 'DataProviderStore');
      } catch (error: any) {
        logger.error('Failed to clone data provider', error, 'DataProviderStore');

        set({
          error: error.message || 'Failed to clone data provider',
          isSaving: false
        });

        throw error;
      }
    },

    // Set as default provider
    setDefault: async (providerId: string, userId: string) => {
      set({ isSaving: true, error: null });

      try {
        logger.info('Setting default data provider', { providerId }, 'DataProviderStore');

        await dataProviderConfigService.setDefault(providerId, userId);

        // Reload all providers to update isDefault flags
        await get().loadProviders(userId);

        logger.info('Default data provider set', { providerId }, 'DataProviderStore');
      } catch (error: any) {
        logger.error('Failed to set default data provider', error, 'DataProviderStore');

        set({
          error: error.message || 'Failed to set default data provider',
          isSaving: false
        });

        throw error;
      }
    },

    // Search providers
    searchProviders: async (query: string, userId: string) => {
      set({ isLoading: true, error: null });

      try {
        logger.info('Searching data providers', { query }, 'DataProviderStore');

        const results = await dataProviderConfigService.search(query, userId);

        set({
          providers: results,
          isLoading: false
        });

        logger.info('Search results', { count: results.length }, 'DataProviderStore');
      } catch (error: any) {
        logger.error('Failed to search data providers', error, 'DataProviderStore');

        set({
          error: error.message || 'Failed to search data providers',
          isLoading: false
        });
      }
    },

    // Set current provider
    setCurrentProvider: (provider: DataProviderConfig | null) => {
      set({
        currentProvider: provider,
        selectedProviderId: provider?.providerId || null,
        isDirty: false
      });

      if (provider) {
        get().validateCurrentProvider();
        get().clearHistory();
        get().pushHistory(provider);
      }
    },

    // Update current provider (local changes)
    updateCurrentProvider: (updates: Partial<DataProviderConfig>) => {
      set(state => {
        if (state.currentProvider) {
          // Push current state to history before updating
          get().pushHistory(state.currentProvider);

          state.currentProvider = {
            ...state.currentProvider,
            ...updates
          };
          state.isDirty = true;
        }
      });

      get().validateCurrentProvider();
    },

    // Validate current provider
    validateCurrentProvider: () => {
      const { currentProvider } = get();

      if (!currentProvider) {
        set({ validationResult: null });
        return;
      }

      const result = validateProviderConfig(currentProvider.config);

      set({ validationResult: result });

      logger.debug('Provider validation', result, 'DataProviderStore');
    },

    // Select a provider
    selectProvider: (providerId: string | null) => {
      set({ selectedProviderId: providerId });

      if (providerId) {
        get().loadProvider(providerId);
      } else {
        set({ currentProvider: null });
      }
    },

    // Clear error
    clearError: () => {
      set({ error: null });
    },

    // Set dirty flag
    setDirty: (dirty: boolean) => {
      set({ isDirty: dirty });
    },

    // Undo
    undo: () => {
      const { history, historyIndex } = get();

      if (historyIndex > 0) {
        const previousState = history[historyIndex - 1];

        set({
          currentProvider: previousState,
          historyIndex: historyIndex - 1,
          isDirty: true
        });

        get().validateCurrentProvider();

        logger.debug('Undo', { historyIndex: historyIndex - 1 }, 'DataProviderStore');
      }
    },

    // Redo
    redo: () => {
      const { history, historyIndex } = get();

      if (historyIndex < history.length - 1) {
        const nextState = history[historyIndex + 1];

        set({
          currentProvider: nextState,
          historyIndex: historyIndex + 1,
          isDirty: true
        });

        get().validateCurrentProvider();

        logger.debug('Redo', { historyIndex: historyIndex + 1 }, 'DataProviderStore');
      }
    },

    // Can undo?
    canUndo: () => {
      return get().historyIndex > 0;
    },

    // Can redo?
    canRedo: () => {
      const { history, historyIndex } = get();
      return historyIndex < history.length - 1;
    },

    // Push to history
    pushHistory: (provider: DataProviderConfig) => {
      set(state => {
        // Remove any future states if we're not at the end
        const newHistory = state.history.slice(0, state.historyIndex + 1);

        // Add new state
        newHistory.push({ ...provider });

        // Limit history to 50 states
        if (newHistory.length > 50) {
          newHistory.shift();
        }

        state.history = newHistory;
        state.historyIndex = newHistory.length - 1;
      });
    },

    // Clear history
    clearHistory: () => {
      set({
        history: [],
        historyIndex: -1
      });
    },

    // Reset store
    reset: () => {
      set({
        providers: [],
        currentProvider: null,
        selectedProviderId: null,
        isLoading: false,
        isSaving: false,
        error: null,
        isDirty: false,
        validationResult: null,
        history: [],
        historyIndex: -1
      });
    }
  }))
);
