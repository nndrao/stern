# OpenFin Integration Examples

## Complete Usage Examples for Stern Platform

This document shows complete integration examples of how OpenFin components work together in the Stern platform.

## Table of Contents

1. [Launching Blotters from Dock](#launching-blotters-from-dock)
2. [Opening Customization Dialogs](#opening-customization-dialogs)
3. [Multi-Window IAB Communication](#multi-window-iab-communication)
4. [Layout Management Workflow](#layout-management-workflow)
5. [Window Cloning Workflow](#window-cloning-workflow)

---

## 1. Launching Blotters from Dock

### Dock Configuration

Configure the dock with menu items that launch different blotter types:

```json
{
  "configId": "dock-default",
  "name": "Default Dock",
  "componentType": "dock",
  "config": {
    "menuItems": [
      {
        "id": "positions-blotter",
        "label": "Positions",
        "tooltip": "Open Positions Blotter",
        "iconUrl": "/icons/positions.svg",
        "action": {
          "id": "launch-blotter",
          "customData": {
            "componentType": "datagrid",
            "componentSubType": "positions",
            "configId": "positions-default"
          }
        }
      },
      {
        "id": "trades-blotter",
        "label": "Trades",
        "tooltip": "Open Trades Blotter",
        "iconUrl": "/icons/trades.svg",
        "action": {
          "id": "launch-blotter",
          "customData": {
            "componentType": "datagrid",
            "componentSubType": "trades",
            "configId": "trades-default"
          }
        }
      }
    ]
  }
}
```

### Dock Action Handler

Update `client/src/platform/dock.ts` to handle blotter launch actions:

```typescript
import { useOpenFinWorkspace } from '@/services/openfin/OpenFinWorkspaceProvider';

const handleCustomAction = async (event: CustomActionEvent) => {
  const { customData } = event;

  if (typeof customData === 'object' && 'componentType' in customData) {
    const { componentType, componentSubType, configId } = customData;

    if (componentType === 'datagrid') {
      // Launch blotter window
      await workspace.createView({
        name: `${componentSubType}-blotter-${Date.now()}`,
        url: `${baseUrl}/blotter?configId=${configId}`,
        customData: {
          configId,
          componentType,
          componentSubType
        }
      });

      logger.info('Launched blotter', {
        componentType,
        componentSubType,
        configId
      }, 'Dock');
    }
  }
};
```

### Result

When user clicks "Positions" in the dock:
1. Dock receives custom action event
2. Handler creates new view with URL: `/blotter?configId=positions-default`
3. UniversalBlotter component loads
4. OpenFinComponentProvider extracts configId from URL
5. Configuration loaded from server
6. Blotter renders with positions data

---

## 2. Opening Customization Dialogs

### From Blotter Toolbar

Add customization buttons to the blotter toolbar:

```typescript
// client/src/components/blotter/Toolbar.tsx

import { useOpenFinWorkspace } from '@/services/openfin/OpenFinWorkspaceProvider';
import { useOpenFinComponent } from '@/components/openfin/OpenFinComponent';
import { Settings2 } from 'lucide-react';

export function Toolbar({ title, isOpenFin, children }: ToolbarProps) {
  const workspace = useOpenFinWorkspace();
  const { identity } = useOpenFinComponent();

  const handleOpenConditionalFormatting = async () => {
    const baseUrl = window.location.origin;

    await workspace.createView({
      name: `conditional-formatting-${identity.configId}`,
      url: `${baseUrl}/dialog/conditional-formatting?configId=${identity.configId}`,
      customData: {
        configId: identity.configId,
        dialogType: 'conditionalFormatting',
        parentWindow: identity.windowName
      },
      bounds: {
        width: 600,
        height: 500
      }
    });

    logger.info('Opened conditional formatting dialog', {
      configId: identity.configId
    }, 'Toolbar');
  };

  return (
    <div className="flex items-center justify-between px-4 py-2">
      <h1>{title}</h1>

      <div className="flex items-center gap-2">
        {children}

        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenConditionalFormatting}
          className="gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Formatting
        </Button>
      </div>
    </div>
  );
}
```

### Dialog Communication Flow

```typescript
// In ConditionalFormattingDialog.tsx

// 1. Dialog notifies parent it opened
useEffect(() => {
  broadcast(`stern.dialog.opened.${identity.configId}`, {
    dialogType: 'conditionalFormatting',
    timestamp: new Date().toISOString()
  });
}, []);

// 2. Dialog listens for config updates from parent
useOpenFinIAB(
  `stern.grid.configUpdated.${identity.configId}`,
  (message) => {
    if (message.payload?.changes?.conditionalFormatting) {
      setRules(message.payload.changes.conditionalFormatting);
    }
  },
  []
);

// 3. When user saves, dialog broadcasts back to parent
const handleSave = async () => {
  await updateConfig({
    config: { conditionalFormatting: rules }
  });

  broadcast(`stern.dialog.saved.${identity.configId}`, {
    type: 'conditionalFormatting',
    payload: { conditionalFormatting: rules }
  });
};
```

---

## 3. Multi-Window IAB Communication

### Scenario: User has 3 Position Windows Open

Each window is an independent clone with separate configId:
- Window 1: `configId=positions-clone-1`
- Window 2: `configId=positions-clone-2`
- Window 3: `configId=positions-clone-3`

### Each Window's Dialog is Independent

```typescript
// Window 1 opens dialog with configId=positions-clone-1
await workspace.createView({
  url: `/dialog/conditional-formatting?configId=positions-clone-1`
});

// Window 2 opens dialog with configId=positions-clone-2
await workspace.createView({
  url: `/dialog/conditional-formatting?configId=positions-clone-2`
});
```

### IAB Topics are Namespaced

```typescript
// Window 1 and its dialog communicate on:
stern.grid.configUpdated.positions-clone-1
stern.dialog.saved.positions-clone-1

// Window 2 and its dialog communicate on:
stern.grid.configUpdated.positions-clone-2
stern.dialog.saved.positions-clone-2

// No cross-talk between windows!
```

### Broadcasting to All Windows (Optional)

If you need to broadcast to all position windows:

```typescript
// Global broadcast (no configId in topic)
broadcast('stern.grid.positionsUpdated', {
  action: 'refresh',
  timestamp: new Date().toISOString()
});

// All position windows listen
useOpenFinIAB('stern.grid.positionsUpdated', (message) => {
  if (message.action === 'refresh') {
    reloadData();
  }
}, []);
```

---

## 4. Layout Management Workflow

### User Workflow

1. User opens Positions blotter with default config
2. User customizes grid (columns, sorting, filtering, conditional formatting)
3. User clicks "Save as Layout" in LayoutSelector
4. User enters name "My Custom View"
5. Layout saved to server in `settings[]` array

### Code Flow

```typescript
// 1. User customizes grid
const handleColumnChange = (columnState: any) => {
  updateConfig({
    config: { columnState }
  });
};

// 2. User saves layout
const handleSaveLayout = async (name: string) => {
  const currentConfig = fullConfig?.config;

  const newLayout: ConfigVersion = {
    name,
    version: `v${Date.now()}`,
    config: currentConfig,  // Snapshot of current state
    createdAt: new Date().toISOString(),
    createdBy: identity.uuid
  };

  // Add to settings array
  await update({
    settings: [...layouts, newLayout]
  });
};

// 3. User switches to layout
const handleLayoutChange = async (layoutName: string) => {
  const layout = layouts.find(l => l.name === layoutName);

  if (layout) {
    // Apply layout config
    await update({
      config: layout.config
    });

    // Broadcast to dialogs
    broadcast(`stern.grid.layoutChanged.${identity.configId}`, {
      layoutName
    });
  }
};
```

### Server Storage

```json
{
  "configId": "positions-default",
  "name": "Positions",
  "componentType": "datagrid",
  "componentSubType": "positions",
  "config": {
    "columns": [...],
    "conditionalFormatting": [...]
  },
  "settings": [
    {
      "name": "My Custom View",
      "version": "v1234567890",
      "config": {
        "columns": [...],
        "conditionalFormatting": [...]
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "createdBy": "user-123"
    }
  ]
}
```

---

## 5. Window Cloning Workflow

### User Workflow

1. User has Positions blotter open with custom config
2. User clicks "Clone Window" button
3. New window opens with exact same config
4. User customizes new window independently

### Code Flow

```typescript
// client/src/components/blotter/WindowCloner.tsx

const handleClone = async () => {
  // 1. Create new config on server (clone of current)
  const newConfig = await apiClient.post('/api/v1/configurations', {
    name: `${config.name} (Clone)`,
    componentType: config.componentType,
    componentSubType: config.componentSubType,
    config: config.config,        // Clone current config
    settings: config.settings,    // Clone all layouts
    createdBy: identity.uuid,
    userId: config.userId
  });

  // 2. Open new window with new configId
  await workspace.createView({
    name: `${identity.windowName}-clone-${Date.now()}`,
    url: `${baseUrl}/blotter?configId=${newConfig.configId}`,
    customData: {
      configId: newConfig.configId,
      componentType: newConfig.componentType,
      componentSubType: newConfig.componentSubType
    }
  });
};
```

### Result

**Original Window:**
- configId: `positions-default`
- Config changes saved to `positions-default`

**Cloned Window:**
- configId: `positions-default-clone-1234567890`
- Config changes saved to `positions-default-clone-1234567890`
- Fully independent from original

---

## Complete Integration Example

### 1. Dock Configuration (Server)

```json
POST /api/v1/configurations
{
  "name": "Trading Dock",
  "componentType": "dock",
  "config": {
    "menuItems": [
      {
        "id": "positions",
        "label": "Positions",
        "iconUrl": "/icons/positions.svg",
        "action": {
          "id": "launch-blotter",
          "customData": {
            "componentType": "datagrid",
            "componentSubType": "positions",
            "configId": "positions-default"
          }
        }
      }
    ]
  }
}
```

### 2. Positions Blotter Configuration (Server)

```json
POST /api/v1/configurations
{
  "name": "Positions",
  "componentType": "datagrid",
  "componentSubType": "positions",
  "config": {
    "columns": [
      { "field": "symbol", "headerName": "Symbol", "width": 120 },
      { "field": "quantity", "headerName": "Quantity", "width": 100 },
      { "field": "price", "headerName": "Price", "width": 100 }
    ],
    "conditionalFormatting": [
      {
        "id": "rule-1",
        "field": "quantity",
        "operator": "greaterThan",
        "value": 1000,
        "backgroundColor": "#00ff00",
        "textColor": "#000000"
      }
    ]
  },
  "settings": []
}
```

### 3. User Opens Positions from Dock

```typescript
// Dock click handler creates view
await workspace.createView({
  name: 'positions-1',
  url: '/blotter?configId=positions-default',
  customData: { configId: 'positions-default' }
});
```

### 4. Blotter Loads

```typescript
// UniversalBlotter component
<OpenFinComponentProvider configId="positions-default" autoLoadConfig={true}>
  <BlotterContent />
</OpenFinComponentProvider>

// Config automatically loaded from server
const { config } = useOpenFinConfig();
// config.config.columns = [...]
// config.config.conditionalFormatting = [...]
```

### 5. User Opens Formatting Dialog

```typescript
// From toolbar
await workspace.createView({
  url: '/dialog/conditional-formatting?configId=positions-default'
});
```

### 6. User Saves Changes in Dialog

```typescript
// Dialog saves and broadcasts
await updateConfig({ config: { conditionalFormatting: rules } });
broadcast('stern.dialog.saved.positions-default', { ... });
```

### 7. Blotter Receives Update

```typescript
// Blotter listens for dialog saves
useOpenFinIAB('stern.dialog.saved.positions-default', (message) => {
  if (message.type === 'conditionalFormatting') {
    // Reload config to get latest
    reloadConfig();
  }
}, []);
```

### 8. User Saves as Layout

```typescript
const newLayout = {
  name: 'High Quantity View',
  config: currentConfig
};

await update({
  settings: [...settings, newLayout]
});
```

### 9. User Clones Window

```typescript
// Create new config
const clonedConfig = await apiClient.post('/api/v1/configurations', {
  name: 'Positions (Clone)',
  config: config.config,
  settings: config.settings
});

// Open new window
await workspace.createView({
  url: `/blotter?configId=${clonedConfig.configId}`
});
```

### 10. Both Windows Operate Independently

**Window 1 (Original):**
- configId: `positions-default`
- IAB topics: `stern.grid.*.positions-default`
- Saves to: `positions-default`

**Window 2 (Clone):**
- configId: `positions-clone-abc123`
- IAB topics: `stern.grid.*.positions-clone-abc123`
- Saves to: `positions-clone-abc123`

---

## Testing in Browser vs OpenFin

### Browser Mode

All components work in browser:
- Blotter loads: ✅
- Config loads from server: ✅
- Layouts work: ✅
- IAB calls are no-ops: ✅ (safe to call)
- Window operations are no-ops: ✅

### OpenFin Mode

Full functionality:
- Blotter loads: ✅
- Config loads from server: ✅
- Layouts work: ✅
- IAB communication: ✅
- Window cloning: ✅
- Dialogs: ✅

---

## Next Steps for Implementation

1. **Implement AG-Grid DataGrid component**
   - Wrap AG-Grid Enterprise
   - Apply config from OpenFinComponentProvider
   - Emit config changes on user interactions

2. **Create remaining dialogs**
   - Column Groups dialog
   - Grid Options dialog
   - Calculated Columns dialog

3. **Implement Data Provider with SharedWorker**
   - STOMP connection via SharedWorker
   - Subscribe to data streams
   - Update grid with live data

4. **Add testing**
   - Unit tests for components
   - Integration tests for IAB communication
   - E2E tests in OpenFin environment
