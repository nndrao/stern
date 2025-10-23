# OpenFin Wrapper Usage Guide

## Overview

The OpenFin Component Wrapper provides a standardized way to create OpenFin-aware React components with automatic:
- Identity management (window/view names, UUID, configId)
- Configuration loading from REST API
- IAB (Inter-Application Bus) communication setup
- Window state management
- Error boundaries

## Core Components

### 1. OpenFinComponentProvider

The main provider that wraps your component and provides OpenFin context.

```typescript
import { OpenFinComponentProvider } from '@/components/openfin/OpenFinComponent';

<OpenFinComponentProvider
  configId="positions-default"          // Optional: configId to load
  autoLoadConfig={true}                 // Auto-load config on mount (default: true)
  autoSetupIAB={true}                   // Auto-setup IAB service (default: true)
  onConfigLoaded={(config) => {
    console.log('Config loaded:', config);
  }}
  onConfigError={(error) => {
    console.error('Config error:', error);
  }}
  onReady={(identity) => {
    console.log('Component ready:', identity);
  }}
>
  <YourComponent />
</OpenFinComponentProvider>
```

### 2. Hooks

#### useOpenFinComponent()
Access full OpenFin component context:

```typescript
import { useOpenFinComponent } from '@/components/openfin/OpenFinComponent';

function MyComponent() {
  const {
    identity,        // { windowName, viewName, uuid, configId, componentType, componentSubType }
    config,          // UnifiedConfig from server
    isOpenFin,       // true if running in OpenFin, false in browser
    isLoading,       // true while loading config
    error,           // Error if config load failed

    // Configuration methods
    reloadConfig,    // () => Promise<void>
    updateConfig,    // (updates: Partial<UnifiedConfig>) => Promise<void>

    // IAB communication
    broadcast,       // (topic: string, payload: any) => Promise<void>
    subscribe,       // (topic: string, handler: (message: any) => void) => () => void

    // Window operations
    closeWindow,     // () => Promise<void>
    maximizeWindow,  // () => Promise<void>
    minimizeWindow,  // () => Promise<void>
    setTitle,        // (title: string) => Promise<void>
  } = useOpenFinComponent();

  return <div>Window: {identity.windowName}</div>;
}
```

#### useOpenFinConfig()
Simplified hook for config access:

```typescript
import { useOpenFinConfig } from '@/components/openfin/OpenFinComponent';

function MyComponent() {
  const {
    config,          // Typed config data (from UnifiedConfig.config)
    fullConfig,      // Full UnifiedConfig object
    isLoading,
    error,
    reload,          // () => Promise<void>
    update,          // (updates: Partial<UnifiedConfig>) => Promise<void>
  } = useOpenFinConfig<MyConfigType>();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Config: {JSON.stringify(config)}</div>;
}
```

#### useOpenFinIAB()
Setup IAB subscription with auto-cleanup:

```typescript
import { useOpenFinIAB } from '@/components/openfin/OpenFinComponent';

function MyComponent() {
  const { broadcast } = useOpenFinIAB(
    'stern.grid.columnChanged.positions',  // Topic to subscribe to
    (message) => {                         // Handler
      console.log('Column changed:', message);
    },
    []  // Dependencies (optional)
  );

  const handleClick = () => {
    broadcast('stern.grid.dataUpdated.positions', { row: 5 });
  };

  return <button onClick={handleClick}>Update</button>;
}
```

#### useOpenFinWindowState()
Manage window state:

```typescript
import { useOpenFinWindowState } from '@/components/openfin/OpenFinComponent';

function MyComponent() {
  const {
    bounds,         // { x, y, width, height }
    isMaximized,
    isMinimized,
    setTitle,       // (title: string) => Promise<void>
    close,          // () => Promise<void>
    maximize,       // () => Promise<void>
    minimize,       // () => Promise<void>
  } = useOpenFinWindowState();

  return (
    <div>
      <button onClick={() => setTitle('New Title')}>Rename</button>
      <button onClick={maximize}>Maximize</button>
      <button onClick={close}>Close</button>
    </div>
  );
}
```

### 3. HOC Pattern

Use `withOpenFin` to wrap a component:

```typescript
import { withOpenFin } from '@/components/openfin/OpenFinComponent';

function MyComponent() {
  return <div>My component</div>;
}

export default withOpenFin(MyComponent, {
  autoLoadConfig: true,
  configId: 'positions-default'
});
```

### 4. Error Boundary

Wrap components with error boundary:

```typescript
import { OpenFinErrorBoundary } from '@/components/openfin/OpenFinComponent';

<OpenFinErrorBoundary
  fallback={<div>Custom error UI</div>}
  onError={(error, errorInfo) => {
    console.error('Component error:', error);
  }}
>
  <MyComponent />
</OpenFinErrorBoundary>
```

## Usage Examples

### Example 1: Universal Blotter Component

```typescript
import React from 'react';
import { OpenFinComponentProvider, useOpenFinComponent, useOpenFinConfig } from '@/components/openfin/OpenFinComponent';
import { DataGrid } from '@/components/datagrid/DataGrid';

interface BlotterProps {
  configId?: string;
}

function BlotterContent() {
  const { identity, broadcast } = useOpenFinComponent();
  const { config, isLoading, error, update } = useOpenFinConfig<DataGridConfig>();

  if (isLoading) {
    return <div>Loading blotter...</div>;
  }

  if (error) {
    return <div>Error loading blotter: {error.message}</div>;
  }

  const handleColumnChange = (columnState: any) => {
    // Update config on server
    update({
      config: {
        ...config,
        columnState
      }
    });

    // Broadcast to other windows
    broadcast('stern.grid.columnChanged.positions', {
      configId: identity.configId,
      columnState
    });
  };

  return (
    <DataGrid
      config={config}
      onColumnChange={handleColumnChange}
    />
  );
}

export function UniversalBlotter({ configId }: BlotterProps) {
  return (
    <OpenFinComponentProvider
      configId={configId}
      autoLoadConfig={true}
      autoSetupIAB={true}
      onReady={(identity) => {
        console.log('Blotter ready:', identity);
      }}
    >
      <BlotterContent />
    </OpenFinComponentProvider>
  );
}
```

### Example 2: Customization Dialog with IAB

```typescript
import React, { useState } from 'react';
import { OpenFinComponentProvider, useOpenFinComponent, useOpenFinIAB } from '@/components/openfin/OpenFinComponent';

function ConditionalFormattingDialogContent() {
  const { identity, updateConfig } = useOpenFinComponent();
  const [rules, setRules] = useState([]);

  // Listen for config updates from parent window
  useOpenFinIAB(
    `stern.grid.configUpdated.${identity.configId}`,
    (message) => {
      if (message.payload.conditionalFormatting) {
        setRules(message.payload.conditionalFormatting);
      }
    },
    []
  );

  const { broadcast } = useOpenFinIAB(
    `stern.dialog.opened.${identity.configId}`,
    () => {}, // No handler needed for broadcast-only
    []
  );

  const handleSave = async () => {
    // Update config on server
    await updateConfig({
      config: {
        conditionalFormatting: rules
      }
    });

    // Broadcast to parent window
    broadcast(`stern.dialog.saved.${identity.configId}`, {
      type: 'conditionalFormatting',
      payload: { conditionalFormatting: rules }
    });
  };

  return (
    <div>
      <h2>Conditional Formatting</h2>
      {/* Rules UI */}
      <button onClick={handleSave}>Save</button>
    </div>
  );
}

export function ConditionalFormattingDialog({ configId }: { configId?: string }) {
  return (
    <OpenFinComponentProvider
      configId={configId}
      autoLoadConfig={true}
      autoSetupIAB={true}
    >
      <ConditionalFormattingDialogContent />
    </OpenFinComponentProvider>
  );
}
```

### Example 3: Layout Selector with Multi-Window Coordination

```typescript
import React, { useState } from 'react';
import { useOpenFinComponent, useOpenFinConfig } from '@/components/openfin/OpenFinComponent';
import { ConfigVersion } from '@stern/shared-types';

export function LayoutSelector() {
  const { identity, updateConfig, broadcast } = useOpenFinComponent();
  const { fullConfig, reload } = useOpenFinConfig();

  const [selectedLayout, setSelectedLayout] = useState<string>('default');

  const layouts = fullConfig?.settings || [];
  const defaultLayout = fullConfig?.config;

  const handleLayoutChange = async (layoutName: string) => {
    if (layoutName === 'default') {
      // Revert to default config
      await reload();
    } else {
      // Find layout in settings array
      const layout = layouts.find(l => l.name === layoutName);
      if (layout) {
        // Apply layout by updating config
        await updateConfig({
          config: layout.config
        });
      }
    }

    setSelectedLayout(layoutName);

    // Broadcast layout change to dialogs
    broadcast(`stern.grid.layoutChanged.${identity.configId}`, {
      layoutName,
      configId: identity.configId
    });
  };

  const handleSaveAsLayout = async (name: string) => {
    const currentConfig = fullConfig?.config;

    const newLayout: ConfigVersion = {
      name,
      version: `v${Date.now()}`,
      config: currentConfig,
      createdAt: new Date().toISOString(),
      createdBy: identity.uuid
    };

    // Add to settings array
    await updateConfig({
      settings: [...layouts, newLayout]
    });

    // Broadcast new layout created
    broadcast(`stern.grid.layoutCreated.${identity.configId}`, {
      layoutName: name,
      configId: identity.configId
    });
  };

  return (
    <div>
      <select value={selectedLayout} onChange={(e) => handleLayoutChange(e.target.value)}>
        <option value="default">Default</option>
        {layouts.map((layout) => (
          <option key={layout.name} value={layout.name}>
            {layout.name}
          </option>
        ))}
      </select>

      <button onClick={() => {
        const name = prompt('Layout name:');
        if (name) handleSaveAsLayout(name);
      }}>
        Save as Layout
      </button>
    </div>
  );
}
```

### Example 4: Window Cloning

```typescript
import React from 'react';
import { useOpenFinComponent } from '@/components/openfin/OpenFinComponent';
import { useOpenFinWorkspace } from '@/services/openfin/OpenFinWorkspaceProvider';
import { configService } from '@/services/configurationService';

export function WindowCloner() {
  const { identity, config } = useOpenFinComponent();
  const workspace = useOpenFinWorkspace();

  const handleClone = async () => {
    // Create new config on server (clone of current)
    const newConfig = await configService.create({
      name: `${config?.name} (Clone)`,
      componentType: config?.componentType,
      componentSubType: config?.componentSubType,
      config: config?.config,  // Clone config
      settings: config?.settings,  // Clone layouts
      createdBy: identity.uuid,
      userId: config?.userId
    });

    // Open new window with new configId
    await workspace.createView({
      name: `${identity.windowName}-clone-${Date.now()}`,
      url: window.location.href.split('?')[0] + `?configId=${newConfig.configId}`,
      customData: {
        configId: newConfig.configId,
        componentType: newConfig.componentType,
        componentSubType: newConfig.componentSubType
      }
    });
  };

  return (
    <button onClick={handleClone}>
      Clone Window
    </button>
  );
}
```

## Integration with Existing OpenFinWorkspaceProvider

The `OpenFinComponentProvider` works alongside the existing `OpenFinWorkspaceProvider`:

```typescript
// main.tsx or App.tsx
import { OpenFinWorkspaceProvider } from '@/services/openfin/OpenFinWorkspaceProvider';
import { UniversalBlotter } from '@/components/blotter/UniversalBlotter';

function App() {
  return (
    <OpenFinWorkspaceProvider>  {/* Workspace-level services */}
      <UniversalBlotter />       {/* Component-level provider inside */}
    </OpenFinWorkspaceProvider>
  );
}
```

## Best Practices

1. **Always wrap with OpenFinComponentProvider** at the component root to get automatic identity and config management

2. **Use useOpenFinConfig for config access** instead of useOpenFinComponent when you only need config data

3. **Cleanup IAB subscriptions** by using the useOpenFinIAB hook (auto-cleanup) instead of manual subscribe/unsubscribe

4. **Broadcast config changes** to keep dialogs in sync:
   ```typescript
   await updateConfig(changes);
   broadcast(`stern.grid.configUpdated.${configId}`, changes);
   ```

5. **Use configId from identity** for namespaced IAB topics:
   ```typescript
   const topic = `stern.grid.columnChanged.${identity.configId}`;
   ```

6. **Handle browser vs OpenFin** gracefully - the provider automatically provides mock services in browser

7. **Use Error Boundaries** to catch component errors and provide fallback UI

## Testing

### Browser Testing
The wrapper provides mock services automatically when not running in OpenFin:
- Mock identity with browser-based windowName
- Config loading from REST API works the same
- IAB messages are no-ops (safe to call)

### OpenFin Testing
Use the `launch-openfin.bat` script to test in OpenFin environment.

## Migration from AGV3

If migrating from AGV3 `DataGridStompShared`:

**Old AGV3 pattern:**
```typescript
// AGV3 - manual setup
useEffect(() => {
  const configId = searchParams.get('configId');
  loadConfig(configId);
}, []);
```

**New Stern pattern:**
```typescript
// Stern - automatic
<OpenFinComponentProvider configId={configId} autoLoadConfig={true}>
  <MyComponent />  {/* Config automatically loaded */}
</OpenFinComponentProvider>
```

## Next Steps

1. Implement `DataGrid` component with AG-Grid Enterprise
2. Create customization dialogs using the wrapper pattern
3. Implement layout management UI
4. Add data provider integration with SharedWorker
