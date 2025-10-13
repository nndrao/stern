# OpenFin Dock Implementation - Following workspace-starter Patterns

This document explains our OpenFin Dock implementation, which follows the exact patterns from OpenFin's official workspace-starter examples.

## Overview

Our implementation is based on:
- `workspace-starter/how-to/register-with-dock-basic` - Basic dock registration patterns
- `workspace-starter/how-to/workspace-platform-starter` - Production-ready patterns

## Key Principles

### 1. Use OpenFin's Built-in Dock API
We use `Dock.register()` from `@openfin/workspace`, not custom window management. This ensures compatibility and leverages OpenFin's built-in features.

### 2. Custom Actions Registration
Custom actions MUST be registered BEFORE dock registration in the platform `init()` call:

```typescript
await init({
  customActions: dock.dockGetCustomActions(),
  // ... other config
});
```

### 3. Efficient Updates
Use `updateDockProviderConfig()` for configuration updates instead of deregister/register cycles:

```typescript
await registration.updateDockProviderConfig(newConfig);
```

### 4. Full Reload Pattern
When full reload is necessary:
```typescript
// 1. Deregister
await Dock.deregister();

// 2. Wait 500ms for cleanup (CRITICAL)
await new Promise(resolve => setTimeout(resolve, 500));

// 3. Re-register
registration = await Dock.register(config);

// 4. Show dock
await Dock.show();
```

### 5. Developer Tools Access
Finding the dock window requires a comprehensive search strategy across all applications and windows.

## File Structure

```
client/src/platform/
  ├── dock.ts                 # Main dock implementation (NEW)
  ├── Provider.tsx            # Platform initialization (UPDATED)
  └── menuLauncher.ts         # Launch logic for menu items

client/src/components/provider/
  └── DockConfigEditor.tsx    # Dock configuration UI (UPDATED)
```

## API Reference

### dock.ts Public API

#### `isDockAvailable(): boolean`
Checks if the Dock API is available in the current environment.

```typescript
if (dock.isDockAvailable()) {
  // Safe to use dock APIs
}
```

#### `register(config: DockConfig): Promise<DockProviderRegistration>`
Register the dock with OpenFin Workspace.

```typescript
await dock.register({
  id: 'my-platform',
  title: 'My Platform',
  icon: '/icon.svg',
  menuItems: [], // Array of DockMenuItem
  workspaceComponents: {
    hideWorkspacesButton: false,
    hideHomeButton: true,
    hideNotificationsButton: true,
    hideStorefrontButton: true
  },
  disableUserRearrangement: false
});
```

#### `registerFromConfig(config: DockConfiguration): Promise<DockProviderRegistration>`
Register dock from a full DockConfiguration object (from API).

```typescript
const config = await dockConfigService.loadById(configId);
await dock.registerFromConfig(config);
```

#### `show(): Promise<void>`
Show the dock after registration.

```typescript
await dock.show();
```

#### `updateConfig(config): Promise<void>`
Update dock configuration efficiently without deregister/register cycle.

```typescript
await dock.updateConfig({
  menuItems: updatedMenuItems
});
```

#### `reload(): Promise<void>`
Full dock reload (deregister -> wait -> register -> show).

```typescript
await dock.reload();
```

#### `deregister(): Promise<void>`
Deregister the dock.

```typescript
await dock.deregister();
```

#### `dockGetCustomActions(): CustomActionsMap`
Get custom actions for dock buttons. Must be registered in platform init.

```typescript
await init({
  customActions: dock.dockGetCustomActions()
});
```

## Dock Structure

The dock is organized with three main dropdown buttons:

### 1. Applications Button
Contains all configured menu items from the Dock Configuration screen.

- **Icon**: `/icons/app.svg`
- **Structure**: Supports nested submenus (items with children)
- **Launch**: All items use the `launch-component` custom action
- **Example Structure**:
  ```
  Applications
  ├── Trading Apps
  │   ├── Blotter
  │   └── Order Entry
  ├── Analytics
  │   ├── Risk Dashboard
  │   └── P&L Reports
  └── Simple App (no children)
  ```

### 2. Theme Button
Theme switching dropdown.

- **Options**: Light Theme, Dark Theme
- **Action**: `set-theme` with theme name as customData

### 3. Tools Button
Utility functions dropdown.

- **Reload Dock** - Full dock reload (deregister/register cycle)
- **Show Dock Developer Tools** - Opens devtools for dock window
- **Toggle Provider Window** - Shows/hides configuration window

## Custom Actions

Our implementation provides the following custom actions:

### `launch-component`
Launches a component/application from a dock menu item.

- Handles both direct buttons and dropdown menu items
- Checks `payload.callerType` to determine the caller context
- Passes menu item data in `customData`

### `set-theme`
Sets the platform theme (light or dark).

- Only responds to `CustomDropdownItem` caller type
- Receives theme name ('light' or 'dark') in customData
- Uses `platform.Theme.setSelectedScheme()`

### `reload-dock`
Performs a full dock reload using the deregister/register pattern.

- Triggered by the "Reload Dock" button in Tools dropdown
- Uses the 500ms delay pattern from workspace-starter

### `show-dock-devtools`
Opens developer tools for the dock window.

Uses a comprehensive 3-strategy search:

1. **Search all applications** for workspace-related UUIDs
   - Look for `openfin-workspace`, `workspace`, etc.
   - Check child windows for dock-related names

2. **Check all windows** for dock-related names
   - Iterate through all windows
   - Look for 'dock' in window names

3. **Fallback to current window** if dock not found

### `toggle-provider-window`
Shows/hides the provider configuration window.

## Initialization Sequence

The correct initialization order is critical:

```typescript
// 1. Initialize platform with custom actions
await init({
  browser: { /* config */ },
  theme: [ /* themes */ ],
  customActions: dock.dockGetCustomActions()  // BEFORE dock registration
});

// 2. Wait for platform-api-ready event
platform.once("platform-api-ready", async () => {
  // 3. Wait a bit for workspace APIs to be fully ready
  await new Promise(resolve => setTimeout(resolve, 500));

  // 4. Register dock
  await dock.register(config);

  // 5. Show dock
  await dock.show();
});
```

## Configuration Update Flow

### Efficient Update (Preferred)
When menu items change:

```typescript
// Save configuration to API
await dockConfigService.update(configId, updates);

// Update dock efficiently (no deregister/register)
await dock.updateConfig({
  menuItems: updates.config.menuItems
});
```

This uses `registration.updateDockProviderConfig()` internally, which is much faster than full reload.

### Full Reload (Fallback)
If efficient update fails or fundamental settings change:

```typescript
await dock.reload();
```

## Button Configuration

### Standard Button
```typescript
{
  tooltip: "My App",
  iconUrl: "https://example.com/icon.png",
  action: {
    id: "launch-component",
    customData: menuItem
  },
  contextMenu: {
    removeOption: true  // Allow user to remove
  }
}
```

### Dropdown Button
```typescript
{
  type: DockButtonNames.DropdownButton,
  tooltip: "My Apps",
  iconUrl: "https://example.com/icon.png",
  options: [
    {
      tooltip: "Sub App 1",
      iconUrl: "https://example.com/icon1.png",
      action: {
        id: "launch-component",
        customData: menuItem1
      }
    },
    {
      tooltip: "Sub App 2",
      iconUrl: "https://example.com/icon2.png",
      action: {
        id: "launch-component",
        customData: menuItem2
      }
    }
  ],
  contextMenu: {
    removeOption: true
  }
}
```

## System Buttons

Every dock includes these system buttons:

1. **Reload Dock** - Full dock reload
2. **Show Dock Developer Tools** - Opens devtools for dock window
3. **Toggle Provider Window** - Shows/hides the configuration window

These are automatically added by `buildSystemButtons()` in dock.ts.

## Workspace Components

Workspace components are OpenFin's built-in buttons:

```typescript
workspaceComponents: {
  hideWorkspacesButton: false,     // Show workspace switcher
  hideHomeButton: true,            // Hide home (if not using)
  hideNotificationsButton: true,   // Hide notifications (if not using)
  hideStorefrontButton: true       // Hide store (if not using)
}
```

Only show buttons for features you've actually registered in your platform.

## Error Handling

All dock operations include comprehensive error handling:

```typescript
try {
  await dock.updateConfig(config);
  logger.info('Dock updated successfully');
} catch (error) {
  logger.error('Failed to update dock', error);
  // Try full reload as fallback
  try {
    await dock.reload();
  } catch (reloadError) {
    logger.error('Failed to reload dock', reloadError);
  }
}
```

## Logging

All operations are logged using our logger utility:

- `logger.info()` - Important operations (register, update, show)
- `logger.debug()` - Detailed information (button counts, config details)
- `logger.warn()` - Warnings (fallbacks, missing config)
- `logger.error()` - Errors with stack traces

## Testing Checklist

When testing dock features:

- [ ] Dock registers successfully on platform startup
- [ ] Dock shows after registration
- [ ] Custom buttons launch correct applications
- [ ] Dropdown menus show nested items correctly
- [ ] Reload Dock button performs full reload
- [ ] Show Dock Developer Tools opens devtools for dock window
- [ ] Toggle Provider Window shows/hides configuration window
- [ ] Configuration changes update dock immediately
- [ ] Save operation updates dock with new menu items
- [ ] Dock persists across page reloads
- [ ] Error handling works (network failures, etc.)

## Differences from Previous Implementation

### Old Approach (Problematic)
```typescript
// Manual window management
await Dock.deregister();
await registerDockFromConfig(config);
await showDock();
// Sometimes dock would disappear or reload would fail
```

### New Approach (Following workspace-starter)
```typescript
// Efficient update
await dock.updateConfig({ menuItems });

// Or full reload with proper pattern
await dock.reload();  // Includes 500ms delay
```

### Key Improvements
1. ✅ Uses `updateDockProviderConfig()` for efficient updates
2. ✅ Proper 500ms delay in full reload pattern
3. ✅ Comprehensive devtools search strategy
4. ✅ Better error handling and logging
5. ✅ Clean module-level state management
6. ✅ Deterministic behavior matching OpenFin patterns

## Common Issues and Solutions

### Issue: Dock disappears after save
**Solution**: Use `updateConfig()` instead of deregister/register cycle

### Issue: Developer Tools doesn't open
**Solution**: The new implementation searches all applications and windows systematically

### Issue: Reload doesn't work
**Solution**: The new implementation includes the critical 500ms delay between deregister and register

### Issue: Custom actions not working
**Solution**: Ensure custom actions are registered BEFORE dock in platform init()

## References

- OpenFin Workspace Starter: `C:\Users\developer\Documents\projects\workspace-starter-main\how-to\`
- Our implementation: `client/src/platform/dock.ts`
- Configuration UI: `client/src/components/provider/DockConfigEditor.tsx`
- Platform init: `client/src/platform/Provider.tsx`

## Support

For issues with dock implementation, check:
1. Console logs (all operations are logged)
2. OpenFin devtools (press Ctrl+Shift+I in any window)
3. Dock devtools (use "Show Dock Developer Tools" button)
4. This documentation
5. workspace-starter examples in the reference folder
