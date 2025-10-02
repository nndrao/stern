/**
 * Menu Launcher
 * Handles launching components from dock menu items
 */

import { getCurrentSync } from '@openfin/workspace-platform';
import { DockMenuItem } from '../types/dockConfig';
import { buildUrl } from '../openfin-utils';
import { logger } from '@/utils/logger';

/**
 * Launch a menu item as a window or view
 */
export async function launchMenuItem(item: DockMenuItem): Promise<void> {
  if (!item.url) {
    logger.warn('Menu item has no URL', item, 'menuLauncher');
    return;
  }

  // Build the full URL with the item ID as a query parameter
  const url = `${buildUrl(item.url)}?id=${encodeURIComponent(item.id)}`;

  try {
    const platform = getCurrentSync();

    if (item.openMode === 'window') {
      // Launch as a new window
      const windowOptions = {
        name: `${item.id}-window-${Date.now()}`,
        url,
        defaultWidth: item.windowOptions?.width || 1200,
        defaultHeight: item.windowOptions?.height || 800,
        defaultCentered: item.windowOptions?.center ?? true,
        autoShow: true,
        frame: item.windowOptions?.frame ?? true,
        contextMenu: item.windowOptions?.contextMenu ?? true,
        resizable: item.windowOptions?.resizable ?? true,
        maximizable: item.windowOptions?.maximizable ?? true,
        minimizable: item.windowOptions?.minimizable ?? true,
        alwaysOnTop: item.windowOptions?.alwaysOnTop ?? false,
        minWidth: item.windowOptions?.minWidth,
        minHeight: item.windowOptions?.minHeight,
        maxWidth: item.windowOptions?.maxWidth,
        maxHeight: item.windowOptions?.maxHeight,
        accelerator: item.windowOptions?.accelerator || {
          zoom: true,
          reload: true,
          devtools: true
        }
      };

      await platform.createWindow(windowOptions);

      logger.info(`Launched ${item.caption} as window`, { url }, 'menuLauncher');
    } else {
      // Launch as a view in the current window
      const viewOptions = {
        name: `${item.id}-view-${Date.now()}`,
        url,
        bounds: {
          top: item.viewOptions?.bounds?.y || 0,
          left: item.viewOptions?.bounds?.x || 0,
          width: item.viewOptions?.bounds?.width || 800,
          height: item.viewOptions?.bounds?.height || 600
        },
        customData: {
          ...item.viewOptions?.customData,
          menuItemId: item.id,
          caption: item.caption
        }
      };

      await platform.createView(viewOptions as any);

      logger.info(`Launched ${item.caption} as view`, { url }, 'menuLauncher');
    }
  } catch (error) {
    logger.error('Failed to launch menu item', error, 'menuLauncher');
    throw error;
  }
}

/**
 * Launch multiple menu items
 */
export async function launchMenuItems(items: DockMenuItem[]): Promise<void> {
  for (const item of items) {
    try {
      await launchMenuItem(item);
      // Small delay between launches to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      logger.error(`Failed to launch ${item.caption}`, error, 'menuLauncher');
    }
  }
}

/**
 * Check if a component is already open
 */
export async function isComponentOpen(itemId: string): Promise<boolean> {
  try {
    const platform = getCurrentSync();
    const windows = await fin.System.getAllWindows();

    // Check if any window or view has this item ID in its name
    for (const window of windows) {
      const windowName = (window as any).name || (window as any).mainWindow?.name;
      if (windowName?.includes(itemId)) {
        return true;
      }

      // Check views within the window
      if (window.childWindows) {
        for (const child of window.childWindows) {
          if (child.name?.includes(itemId)) {
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    logger.error('Error checking if component is open', error, 'menuLauncher');
    return false;
  }
}

/**
 * Focus an already open component
 */
export async function focusComponent(itemId: string): Promise<boolean> {
  try {
    const windows = await fin.System.getAllWindows();

    // Find and focus the window or view with this item ID
    for (const windowInfo of windows) {
      const windowName = (windowInfo as any).name || (windowInfo as any).mainWindow?.name;
      const windowUuid = (windowInfo as any).uuid || (windowInfo as any).mainWindow?.uuid;
      if (windowName?.includes(itemId)) {
        const window = fin.Window.wrapSync({
          uuid: windowUuid,
          name: windowName
        });
        await window.setAsForeground();
        await window.focus();
        return true;
      }

      // Check views within the window
      if (windowInfo.childWindows) {
        for (const child of windowInfo.childWindows) {
          const childName = (child as any).name;
          const childUuid = (child as any).uuid || (child as any).entityType;
          if (childName?.includes(itemId)) {
            const view = fin.View.wrapSync({
              uuid: childUuid,
              name: childName
            });
            await view.focus();
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    logger.error('Error focusing component', error, 'menuLauncher');
    return false;
  }
}

/**
 * Launch or focus a component
 * If already open, brings it to focus. Otherwise launches it.
 */
export async function launchOrFocusComponent(item: DockMenuItem): Promise<void> {
  const isOpen = await isComponentOpen(item.id);

  if (isOpen) {
    const focused = await focusComponent(item.id);
    if (focused) {
      logger.info(`Focused existing component: ${item.caption}`, undefined, 'menuLauncher');
      return;
    }
  }

  // Not open or couldn't focus, launch new instance
  await launchMenuItem(item);
}