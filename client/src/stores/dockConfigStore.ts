/**
 * Dock Configuration Store
 * State management for dock configuration editor using Zustand
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  DockMenuItem,
  DockConfiguration,
  DockApplicationsMenuItemsConfig,
  createMenuItem,
  createDockConfiguration,
} from '@/openfin/types/dockConfig';
import { dockConfigService } from '@/services/dockConfigService';
import { logger } from '@/utils/logger';
import { COMPONENT_SUBTYPES } from '@stern/shared-types';

interface HistoryState {
  past: DockConfiguration[];
  future: DockConfiguration[];
}

interface DockConfigStore {
  // State
  currentConfig: DockConfiguration | null;
  selectedNode: DockMenuItem | null;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;

  // History for undo/redo
  history: HistoryState;
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  loadConfig: (userId: string) => Promise<void>;
  saveConfig: () => Promise<void>;
  setConfig: (config: DockConfiguration) => void;
  createNewConfig: (userId: string, appId: string) => void;

  // Menu item operations
  addMenuItem: (parent?: DockMenuItem, item?: DockMenuItem) => void;
  updateMenuItem: (id: string, updates: Partial<DockMenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  reorderItems: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  selectNode: (node: DockMenuItem | null) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;

  // Utility
  clearError: () => void;
  setError: (error: string) => void;
}

/**
 * Deep clone a configuration for history
 */
function cloneConfig(config: DockConfiguration): DockConfiguration {
  return JSON.parse(JSON.stringify(config));
}

/**
 * Find menu item by ID recursively
 */
function findMenuItem(items: DockMenuItem[], id: string): DockMenuItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findMenuItem(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find parent of menu item by ID recursively
 */
function findParentMenuItem(
  items: DockMenuItem[],
  id: string,
  parent: DockMenuItem | null = null
): DockMenuItem | null {
  for (const item of items) {
    if (item.id === id) return parent;
    if (item.children) {
      const found = findParentMenuItem(item.children, id, item);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Update menu item recursively
 */
function updateMenuItemRecursive(
  items: DockMenuItem[],
  id: string,
  updates: Partial<DockMenuItem>
): DockMenuItem[] {
  return items.map(item => {
    if (item.id === id) {
      return { ...item, ...updates };
    }
    if (item.children) {
      return {
        ...item,
        children: updateMenuItemRecursive(item.children, id, updates)
      };
    }
    return item;
  });
}

/**
 * Delete menu item recursively
 */
function deleteMenuItemRecursive(items: DockMenuItem[], id: string): DockMenuItem[] {
  const result: DockMenuItem[] = [];
  for (const item of items) {
    if (item.id !== id) {
      if (item.children) {
        result.push({
          ...item,
          children: deleteMenuItemRecursive(item.children, id)
        });
      } else {
        result.push(item);
      }
    }
  }
  return result;
}

/**
 * Create the dock configuration store
 */
export const useDockConfigStore = create<DockConfigStore>()(
  devtools((set, get) => ({
    // Initial state
    currentConfig: null,
    selectedNode: null,
    isDirty: false,
    isLoading: false,
    error: null,
    history: {
      past: [],
      future: [],
    },
    canUndo: false,
    canRedo: false,

    // Load configuration from API
    loadConfig: async (userId: string) => {
      set({
        isLoading: true,
        error: null
      });

      try {
        logger.info('Loading dock applications menu items configuration', { userId }, 'dockConfigStore');
        const config = await dockConfigService.loadApplicationsMenuItems(userId);

        if (config && config.config?.menuItems && config.config.menuItems.length > 0) {
          logger.info('Loaded DockApplicationsMenuItems config', {
            configId: config.configId,
            name: config.name,
            menuItemsCount: config.config.menuItems.length
          }, 'dockConfigStore');
          logger.debug('Config menu items with children',
            config.config.menuItems.map(item => ({
              caption: item.caption,
              hasChildren: !!item.children,
              childrenCount: item.children?.length || 0
            })),
            'dockConfigStore'
          );

          set({
            currentConfig: config as DockConfiguration,
            isDirty: false,
            isLoading: false
          });
        } else {
          logger.warn('No DockApplicationsMenuItems config found, creating new one', undefined, 'dockConfigStore');
          // Create new config if none exists
          const newConfig = createDockConfiguration(userId, 'stern-platform') as DockConfiguration;
          logger.debug('New config created', newConfig, 'dockConfigStore');

          set({
            currentConfig: newConfig,
            isDirty: true,
            isLoading: false
          });
        }
      } catch (error) {
        logger.error('Failed to load configuration', error, 'dockConfigStore');
        set({
          error: error instanceof Error ? error.message : 'Failed to load configuration',
          isLoading: false
        });
      }
    },

    // Save configuration to API
    saveConfig: async () => {
      const { currentConfig } = get();
      if (!currentConfig) {
        logger.error('No current config to save', undefined, 'dockConfigStore');
        return;
      }

      logger.info('Saving configuration', {
        configId: currentConfig.configId,
        name: currentConfig.name,
        menuItemsCount: currentConfig.config?.menuItems?.length
      }, 'dockConfigStore');
      logger.debug('Save - All menu items', currentConfig.config?.menuItems, 'dockConfigStore');

      set({
        isLoading: true,
        error: null
      });

      try {
        if (currentConfig.configId) {
          // For updates, only send the fields that can be updated
          const updates = {
            name: currentConfig.name,
            description: currentConfig.description,
            icon: currentConfig.icon,
            config: currentConfig.config,
            settings: currentConfig.settings,
            activeSetting: currentConfig.activeSetting || '',
            tags: currentConfig.tags,
            category: currentConfig.category,
            isShared: currentConfig.isShared,
            isDefault: currentConfig.isDefault,
            isLocked: currentConfig.isLocked,
            lastUpdatedBy: currentConfig.lastUpdatedBy,
            componentSubType: COMPONENT_SUBTYPES.DOCK_APPLICATIONS_MENU_ITEMS
          };

          logger.info('Updating existing config', {
            configId: currentConfig.configId,
            menuItemsInUpdate: updates.config?.menuItems?.length
          }, 'dockConfigStore');
          logger.debug('Sending menu items to server', updates.config?.menuItems, 'dockConfigStore');

          const updated = await dockConfigService.update(currentConfig.configId, updates);

          logger.info('Update successful', {
            configId: updated.configId,
            menuItemsReturned: updated.config?.menuItems?.length
          }, 'dockConfigStore');
          logger.debug('Server returned menu items', updated.config?.menuItems, 'dockConfigStore');
        } else {
          // For new configs, send the full config
          const configToSave = {
            ...currentConfig,
            activeSetting: currentConfig.activeSetting || '',
            componentSubType: COMPONENT_SUBTYPES.DOCK_APPLICATIONS_MENU_ITEMS
          };

          logger.info('Saving new config', undefined, 'dockConfigStore');
          const saved = await dockConfigService.save(configToSave);
          logger.info('Save successful', saved, 'dockConfigStore');
          set((state) => ({
            ...state,
            currentConfig: state.currentConfig ? { ...state.currentConfig, configId: saved.configId } : null
          }));
        }

        set({
          isDirty: false,
          isLoading: false
        });
      } catch (error) {
        logger.error('Save failed', error, 'dockConfigStore');
        logger.error('Error details', {
          message: error instanceof Error ? error.message : 'Unknown error',
          response: (error as any)?.response?.data,
          status: (error as any)?.response?.status,
          config: (error as any)?.config
        }, 'dockConfigStore');
        set({
          error: error instanceof Error ? error.message : 'Failed to save configuration',
          isLoading: false
        });
      }
    },

    // Set configuration directly
    setConfig: (config: DockConfiguration) => {
      set({
        currentConfig: config,
        isDirty: true,
        selectedNode: null
      });
    },

    // Create new configuration
    createNewConfig: (userId: string, appId: string) => {
      const newConfig = createDockConfiguration(userId, appId) as DockConfiguration;
      set({
        currentConfig: newConfig,
        isDirty: true,
        selectedNode: null,
        history: { past: [], future: [] },
        canUndo: false,
        canRedo: false
      });
    },

    // Add menu item
    addMenuItem: (parent?: DockMenuItem, item?: DockMenuItem) => {
      const state = get();
      if (!state.currentConfig) return;

      const newItem = item || createMenuItem();
      let newMenuItems = [...(state.currentConfig.config.menuItems || [])];

      logger.debug('Adding menu item', {
        currentItemsCount: newMenuItems.length,
        newItemCaption: newItem.caption,
        parentCaption: parent?.caption || 'ROOT'
      }, 'dockConfigStore');

      if (parent) {
        // Add as child
        newMenuItems = newMenuItems.map(menuItem =>
          addChildToItem(menuItem, parent.id, newItem)
        );
      } else {
        // Add to root
        newMenuItems.push(newItem);
      }

      logger.debug('Menu item added', { totalItemsCount: newMenuItems.length }, 'dockConfigStore');

      // Save to history
      const newHistory = {
        past: [...state.history.past, cloneConfig(state.currentConfig)].slice(-50),
        future: []
      };

      set({
        currentConfig: {
          ...state.currentConfig,
          config: {
            ...state.currentConfig.config,
            menuItems: newMenuItems
          }
        },
        history: newHistory,
        canUndo: true,
        canRedo: false,
        isDirty: true
      });
    },

    // Update menu item
    updateMenuItem: (id: string, updates: Partial<DockMenuItem>) => {
      const state = get();
      if (!state.currentConfig) return;

      const newMenuItems = updateMenuItemRecursive(state.currentConfig.config.menuItems || [], id, updates);

      // Save to history
      const newHistory = {
        past: [...state.history.past, cloneConfig(state.currentConfig)].slice(-50),
        future: []
      };

      // Update selected node if it's the one being updated
      const newSelectedNode = state.selectedNode?.id === id
        ? { ...state.selectedNode, ...updates }
        : state.selectedNode;

      set({
        currentConfig: {
          ...state.currentConfig,
          config: {
            ...state.currentConfig.config,
            menuItems: newMenuItems
          }
        },
        selectedNode: newSelectedNode,
        history: newHistory,
        canUndo: true,
        canRedo: false,
        isDirty: true
      });
    },

    // Delete menu item
    deleteMenuItem: (id: string) => {
      const state = get();
      if (!state.currentConfig) return;

      const newMenuItems = deleteMenuItemRecursive(state.currentConfig.config.menuItems || [], id);

      // Save to history
      const newHistory = {
        past: [...state.history.past, cloneConfig(state.currentConfig)].slice(-50),
        future: []
      };

      // Clear selection if deleted item was selected
      const newSelectedNode = state.selectedNode?.id === id ? null : state.selectedNode;

      set({
        currentConfig: {
          ...state.currentConfig,
          config: {
            ...state.currentConfig.config,
            menuItems: newMenuItems
          }
        },
        selectedNode: newSelectedNode,
        history: newHistory,
        canUndo: true,
        canRedo: false,
        isDirty: true
      });
    },

    // Reorder items
    reorderItems: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
      const state = get();
      if (!state.currentConfig) return;

      let newMenuItems = [...(state.currentConfig.config.menuItems || [])];

      // Find and remove source item
      const sourceItem = findMenuItem(newMenuItems, sourceId);
      if (!sourceItem) return;

      newMenuItems = deleteMenuItemRecursive(newMenuItems, sourceId);

      // Insert at new position
      if (position === 'inside') {
        newMenuItems = newMenuItems.map(item =>
          addChildToItem(item, targetId, sourceItem)
        );
      } else {
        const targetParent = findParentMenuItem(state.currentConfig.config.menuItems || [], targetId);
        if (targetParent) {
          newMenuItems = newMenuItems.map(item =>
            insertItemRelativeToTarget(item, targetId, sourceItem, position, targetParent.id)
          );
        } else {
          // Insert at root level
          const targetIndex = newMenuItems.findIndex((item: DockMenuItem) => item.id === targetId);
          if (targetIndex !== -1) {
            const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
            newMenuItems.splice(insertIndex, 0, sourceItem);
          }
        }
      }

      // Save to history
      const newHistory = {
        past: [...state.history.past, cloneConfig(state.currentConfig)].slice(-50),
        future: []
      };

      set({
        currentConfig: {
          ...state.currentConfig,
          config: {
            ...state.currentConfig.config,
            menuItems: newMenuItems
          }
        },
        history: newHistory,
        canUndo: true,
        canRedo: false,
        isDirty: true
      });
    },

    // Select node
    selectNode: (node: DockMenuItem | null) => {
      set({
        selectedNode: node
      });
    },

    // Undo
    undo: () => {
      const state = get();
      if (state.history.past.length === 0) return;

      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);
      const newFuture = state.currentConfig
        ? [cloneConfig(state.currentConfig), ...state.history.future].slice(0, 50)
        : state.history.future;

      set({
        currentConfig: previous,
        selectedNode: null,
        history: {
          past: newPast,
          future: newFuture
        },
        canUndo: newPast.length > 0,
        canRedo: true,
        isDirty: true
      });
    },

    // Redo
    redo: () => {
      const state = get();
      if (state.history.future.length === 0) return;

      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      const newPast = state.currentConfig
        ? [...state.history.past, cloneConfig(state.currentConfig)].slice(-50)
        : state.history.past;

      set({
        currentConfig: next,
        selectedNode: null,
        history: {
          past: newPast,
          future: newFuture
        },
        canUndo: true,
        canRedo: newFuture.length > 0,
        isDirty: true
      });
    },

    // Clear error
    clearError: () => {
      set({ error: null });
    },

    // Set error
    setError: (error: string) => {
      set({ error });
    },
  }))
);

// Helper function to add child to item
function addChildToItem(item: DockMenuItem, parentId: string, child: DockMenuItem): DockMenuItem {
  if (item.id === parentId) {
    return {
      ...item,
      children: [...(item.children || []), child]
    };
  }
  if (item.children) {
    return {
      ...item,
      children: item.children.map(childItem =>
        addChildToItem(childItem, parentId, child)
      )
    };
  }
  return item;
}

// Helper function to insert item relative to target
function insertItemRelativeToTarget(
  item: DockMenuItem,
  targetId: string,
  newItem: DockMenuItem,
  position: 'before' | 'after',
  parentId: string
): DockMenuItem {
  if (item.id === parentId && item.children) {
    const targetIndex = item.children.findIndex(child => child.id === targetId);
    if (targetIndex !== -1) {
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
      const newChildren = [...item.children];
      newChildren.splice(insertIndex, 0, newItem);
      return {
        ...item,
        children: newChildren
      };
    }
  }
  if (item.children) {
    return {
      ...item,
      children: item.children.map(childItem =>
        insertItemRelativeToTarget(childItem, targetId, newItem, position, parentId)
      )
    };
  }
  return item;
}