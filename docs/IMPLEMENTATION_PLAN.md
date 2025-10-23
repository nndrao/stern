# Stern Platform - Implementation Plan & Architecture Decisions

**Last Updated**: 2025-01-15
**Status**: Planning Phase - Core Architecture Defined

---

## Table of Contents

1. [Architecture Decisions](#architecture-decisions)
2. [Configuration Storage Strategy](#configuration-storage-strategy)
3. [Communication Architecture](#communication-architecture)
4. [Multi-Window Management](#multi-window-management)
5. [Implementation Roadmap](#implementation-roadmap)
6. [OpenFin IAB Protocol Specification](#openfin-iab-protocol-specification)

---

## Architecture Decisions

### ✅ Decision 1: Configuration Storage - REST API (Not IndexedDB)

**Context**: AGV3 uses IndexedDB for local storage. Stern has a centralized REST Configuration Service.

**Decision**: Use REST Configuration Service for ALL configuration storage (not IndexedDB)

**Rationale**:
- ✅ Centralized storage - single source of truth
- ✅ Cross-user, cross-device, cross-window sharing
- ✅ No browser storage limits
- ✅ Survives browser cache clearing
- ✅ SQLite (dev) → MongoDB (prod) automatic switching
- ✅ Version control and audit trail built-in
- ✅ Enterprise-ready backup and recovery

**Implementation**:
```typescript
// All dialogs save to REST API, not IndexedDB
const config = await configService.get(configId);
await configService.update(configId, updatedConfig);
```

---

### ✅ Decision 2: Configuration Structure - Unified Config with Layouts

**Context**: Need to store multiple layouts/profiles for each datagrid.

**Decision**: Use UnifiedConfig with `settings[]` array for layouts

**Structure**:
```typescript
{
  configId: "datagrid-positions-user123-main",
  componentType: "datagrid",
  componentSubType: "positions",

  // DEFAULT LAYOUT (active configuration)
  config: {
    columns: [...],
    gridOptions: {...},
    conditionalFormatting: {
      rules: [...],
      activeRuleIds: [...]
    },
    columnGroups: {
      groups: [...],
      activeGroupIds: [...]
    },
    calculatedColumns: {
      columns: [...],
      activeColumnIds: [...]
    },
    dataProvider: {...}
  },

  // SAVED LAYOUTS (stored as versions)
  settings: [
    {
      versionId: "layout-default",
      name: "Default",
      config: {...}  // Full grid config snapshot
    },
    {
      versionId: "layout-risk-view",
      name: "Risk View",
      config: {...}
    },
    {
      versionId: "layout-pnl-view",
      name: "P&L View",
      config: {...}
    }
  ],

  activeSetting: "layout-risk-view"  // Currently active layout
}
```

**Key Points**:
- ALL datagrid settings in ONE UnifiedConfig
- Conditional formatting is NOT a separate component - it's a property of datagrid config
- Column groups, calculated columns, grid options - all in `config` object
- Layouts = different snapshots of the entire config
- `config` always contains the active/default layout
- `settings[]` contains all saved layouts
- Switch layout = load from settings array and apply to grid

---

### ✅ Decision 3: Multi-Window Strategy - Independent Clones

**Context**: Users want to open multiple Positions windows, each customizable independently.

**Decision**: Clone Window = New Independent Config

**Implementation**:
```typescript
// Window cloning flow:
// 1. User clicks "Clone Window" on Main window
// 2. Creates NEW UnifiedConfig with unique configId
// 3. Copies config + layouts from source
// 4. Opens new OpenFin window with new configId

Main Window:     configId = "datagrid-positions-user123-main"
Clone 1:         configId = "datagrid-positions-user123-clone-1"
Clone 2:         configId = "datagrid-positions-user123-clone-2"

// Each window is FULLY INDEPENDENT:
- Edit conditional formatting in Main → only Main updates
- Switch layout in Clone 1 → only Clone 1 changes
- All windows can connect to SAME data source (STOMP topic)
- Different visualizations of same live data
```

**Benefits**:
- Perfect for multi-monitor trading setups
- Each monitor can show different focus (risk, P&L, intraday)
- Same live data, different layouts/formatting
- No unexpected updates across windows

---

### ✅ Decision 4: Communication Architecture - OpenFin IAB with Explicit Protocol

**Context**: Need communication between dialogs and parent windows. Two options:
1. SharedWorker (simple pub/sub)
2. OpenFin IAB (explicit protocol)

**Decision**: Use OpenFin IAB with well-defined protocol and typed messages

**Rationale**:
- ✅ Explicit protocol with documented topics
- ✅ Type-safe messages with TypeScript interfaces
- ✅ Better debugging and traceability
- ✅ Request/response pattern for dialogs
- ✅ Targeted messaging via configId filtering
- ✅ Native OpenFin integration

**SharedWorker vs OpenFin IAB Comparison**:

| Aspect | SharedWorker | OpenFin IAB |
|--------|--------------|-------------|
| Protocol | Implicit, ad-hoc | Explicit, typed |
| Type Safety | Manual | Built-in TypeScript |
| Debugging | Limited | Full message tracing |
| Documentation | External | Self-documenting |
| OpenFin Integration | Wrapper needed | Native |
| Message Routing | Manual filtering | Built-in identity |

**Decision**: OpenFin IAB for better maintainability

---

## Configuration Storage Strategy

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Configuration REST Service                     │
│              http://localhost:3001/api/v1                  │
│                                                              │
│  GET    /configurations/:id                                 │
│  POST   /configurations                                     │
│  PUT    /configurations/:id                                 │
│  DELETE /configurations/:id                                 │
│                                                              │
│  Storage: SQLite (dev) / MongoDB (prod)                    │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │ HTTP REST API
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────▼─────┐  ┌──────▼──────┐  ┌────▼────────┐
│  Grid Win 1  │  │  Grid Win 2 │  │  Dialog Win │
│  configId:   │  │  configId:  │  │  configId:  │
│  main        │  │  clone-1    │  │  main       │
│              │  │             │  │             │
│ Load config  │  │ Load config │  │ Load config │
│ Save config  │  │ Save config │  │ Save config │
└──────────────┘  └─────────────┘  └─────────────┘
```

### Configuration Operations

```typescript
// Client-side ConfigurationService wrapper
class ConfigurationService {
  private baseUrl = 'http://localhost:3001/api/v1/configurations';

  // Load full config
  async get(configId: string): Promise<UnifiedConfig> {
    const response = await fetch(`${this.baseUrl}/${configId}`);
    return response.json();
  }

  // Create new config
  async create(config: UnifiedConfig): Promise<UnifiedConfig> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return response.json();
  }

  // Update config
  async update(configId: string, updates: Partial<UnifiedConfig>): Promise<void> {
    await fetch(`${this.baseUrl}/${configId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  }

  // Clone datagrid config
  async cloneDataGrid(sourceConfigId: string, newName: string): Promise<UnifiedConfig> {
    const source = await this.get(sourceConfigId);

    const cloned: UnifiedConfig = {
      configId: `${source.configId}-clone-${Date.now()}`,
      ...source,
      name: newName,
      config: JSON.parse(JSON.stringify(source.config)),
      settings: JSON.parse(JSON.stringify(source.settings)),
      creationTime: new Date(),
      lastUpdated: new Date()
    };

    return this.create(cloned);
  }

  // Layout management
  async saveAsNewLayout(configId: string, layoutName: string, layoutConfig: any) {
    const config = await this.get(configId);

    const newLayout = {
      versionId: `layout-${Date.now()}`,
      name: layoutName,
      config: layoutConfig,
      createdTime: new Date(),
      updatedTime: new Date(),
      isActive: false
    };

    config.settings.push(newLayout);
    await this.update(configId, { settings: config.settings });
  }

  async switchLayout(configId: string, layoutId: string) {
    const config = await this.get(configId);

    config.settings = config.settings.map(s => ({
      ...s,
      isActive: s.versionId === layoutId
    }));

    await this.update(configId, {
      activeSetting: layoutId,
      settings: config.settings
    });
  }
}
```

---

## Communication Architecture

### OpenFin IAB Protocol Specification

#### Topic Naming Convention

```
stern.{domain}.{action}.{target}

Examples:
- stern.config.updated
- stern.config.layout.switched
- stern.dialog.apply
- stern.dialog.close
- stern.grid.ready
```

#### Message Types

```typescript
// Base message structure
interface IABMessage<T = any> {
  messageId: string;        // Unique message ID
  timestamp: number;        // When sent
  source: {
    type: 'grid' | 'dialog' | 'toolbar' | 'system';
    windowName: string;     // OpenFin window name
    configId?: string;      // Associated configId
  };
  payload: T;
}

// Broadcast message (no response expected)
interface IABBroadcast<T = any> extends IABMessage<T> {
  responseRequired: false;
  targetConfigIds?: string[];  // Optional filter
}

// Request message (expects response)
interface IABRequest<T = any> extends IABMessage<T> {
  responseRequired: true;
  timeoutMs?: number;
}

// Response message
interface IABResponse<T = any> extends IABMessage<T> {
  requestId: string;
  success: boolean;
  error?: string;
}
```

#### Topic Constants

```typescript
export const IAB_TOPICS = {
  // Configuration domain
  CONFIG: {
    UPDATED: 'stern.config.updated',
    LAYOUT_SWITCHED: 'stern.config.layout.switched',
    LAYOUT_SAVED: 'stern.config.layout.saved',
    LAYOUT_DELETED: 'stern.config.layout.deleted',
  },

  // Dialog domain
  DIALOG: {
    OPEN: 'stern.dialog.open',
    REQUEST_DATA: 'stern.dialog.request.data',
    RESPONSE_DATA: 'stern.dialog.response.data',
    APPLY: 'stern.dialog.apply',
    CLOSE: 'stern.dialog.close',
  },

  // Grid lifecycle domain
  GRID: {
    READY: 'stern.grid.ready',
    DESTROYED: 'stern.grid.destroyed',
  },
} as const;
```

#### Payload Definitions

```typescript
// Config update payload
interface ConfigUpdatePayload {
  configId: string;
  updateType: 'full' | 'partial';
  config: Record<string, unknown>;
  updatedFields?: string[];  // For partial updates
  source: string;
}

// Layout switch payload
interface LayoutSwitchPayload {
  configId: string;
  layoutId: string;
  layoutName: string;
}

// Dialog apply payload
interface DialogApplyPayload {
  configId: string;
  dialogType: 'conditional-formatting' | 'column-groups' | 'grid-options' | 'calculated-columns';
  updates: Record<string, unknown>;
  shouldSave: boolean;  // Save to API or just preview
}
```

#### IAB Service Implementation

```typescript
// services/openfin/IABService.ts
export class IABService {
  private bus: fin.InterApplicationBus;

  // Subscribe to topic
  subscribe<T>(topic: string, handler: (message: IABMessage<T>) => void): () => void {
    const wrappedHandler = async (message: IABMessage<T>) => {
      console.log(`[IAB] Received on ${topic}:`, message);
      await handler(message);
    };

    this.bus.subscribe({ uuid: '*' }, topic, wrappedHandler);

    // Return unsubscribe function
    return () => this.bus.unsubscribe({ uuid: '*' }, topic, wrappedHandler);
  }

  // Broadcast message
  async broadcast<T>(topic: string, payload: T): Promise<void> {
    const message: IABBroadcast<T> = {
      messageId: uuidv4(),
      timestamp: Date.now(),
      source: { type: 'grid', windowName: fin.me.identity.name },
      responseRequired: false,
      payload
    };

    await this.bus.publish(topic, message);
  }

  // Subscribe to config updates for specific configId
  subscribeToConfigUpdates(configId: string, handler: (payload: any) => void): () => void {
    return this.subscribe(IAB_TOPICS.CONFIG.UPDATED, (message) => {
      if (message.payload.configId === configId) {
        handler(message.payload);
      }
    });
  }

  // Broadcast config update
  async broadcastConfigUpdate(
    configId: string,
    config: Record<string, unknown>,
    updateType: 'full' | 'partial' = 'full'
  ): Promise<void> {
    await this.broadcast(IAB_TOPICS.CONFIG.UPDATED, {
      configId,
      updateType,
      config,
      source: fin.me.identity.name
    });
  }
}
```

### Message Flow Examples

#### Example 1: Dialog Updates Conditional Formatting

```
┌─────────────────┐
│ Dialog Window   │
│ (Cond Format)   │
└────────┬────────┘
         │
         │ 1. User clicks "Save"
         │ 2. Save to REST API
         │ 3. Broadcast IAB message
         │
         ▼
    IAB.publish(
      'stern.config.updated',
      {
        configId: 'datagrid-positions-main',
        updateType: 'partial',
        config: { conditionalFormatting: {...} },
        updatedFields: ['conditionalFormatting']
      }
    )
         │
         │ OpenFin IAB broadcasts to all subscribers
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Grid Window 1   │ │ Grid Window 2   │ │ Grid Window 3   │
│ configId: main  │ │ configId: xyz   │ │ configId: main  │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ ✅ Receives     │ │ ❌ Ignores      │ │ ✅ Receives     │
│ Applies config  │ │ (diff configId) │ │ Applies config  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

#### Example 2: Layout Switch

```
┌─────────────────┐
│ Grid Window     │
│ Layout Selector │
└────────┬────────┘
         │
         │ User selects "Risk View" layout
         │
         ▼
    1. Save to REST API:
       PUT /configurations/datagrid-positions-main
       { activeSetting: 'layout-risk-view' }
         │
         ▼
    2. Broadcast IAB:
       IAB.publish('stern.config.layout.switched', {
         configId: 'datagrid-positions-main',
         layoutId: 'layout-risk-view',
         layoutName: 'Risk View'
       })
         │
         ▼
    3. Apply locally + All other windows with same configId update
```

---

## Multi-Window Management

### Window Cloning Flow

```typescript
// 1. User clicks "Clone Window" button in toolbar
const handleCloneWindow = async () => {
  // Get new name from user
  const newName = prompt('Name for cloned window:', `${configName} (Clone)`);

  // Clone configuration
  const clonedConfig = await configService.cloneDataGrid(
    configId,
    newName,
    { includeLayouts: true, openInNewWindow: true }
  );

  // Opens new OpenFin window with cloned configId
  // configId: datagrid-positions-user123-clone-1
};
```

### Window Independence

```
Main Window (configId: main):
- Opens Conditional Formatting dialog
- URL: /conditional-formatting?configId=main
- Dialog saves to configId=main
- Broadcasts: { configId: 'main', ... }
- Only windows with configId=main update

Clone 1 (configId: clone-1):
- Opens Grid Options dialog
- URL: /grid-options?configId=clone-1
- Dialog saves to configId=clone-1
- Broadcasts: { configId: 'clone-1', ... }
- Only windows with configId=clone-1 update

Both can connect to SAME data source:
- dataProvider: { type: 'stomp', topic: '/topic/positions' }
- Same live data, different visualizations
```

---

## Implementation Roadmap

### Phase 1: Foundation (Current - Week 1-2) ✅ COMPLETED
- [x] REST Configuration Service with SQLite/MongoDB
- [x] UnifiedConfig schema with settings array
- [x] Basic CRUD operations
- [x] Dock Configuration UI (proof of concept)
- [x] Theme system (light/dark mode)

### Phase 2: Core DataGrid Infrastructure (Next - Week 3-4)
- [ ] IABService implementation with explicit protocol
- [ ] ConfigurationService client wrapper
- [ ] UniversalBlotter component skeleton
- [ ] DataGrid wrapper component (AG-Grid integration)
- [ ] Basic toolbar with layout selector
- [ ] Window cloning functionality

### Phase 3: Data Provider Architecture (Week 5-6)
- [ ] IDataProvider interface
- [ ] StompProvider implementation
- [ ] SharedWorker for data streaming (ONLY for data, not config)
- [ ] Connection management hooks
- [ ] Data subscription system

### Phase 4: Customization Dialogs (Week 7-9)
- [ ] Conditional Formatting dialog
- [ ] Column Groups dialog
- [ ] Grid Options dialog
- [ ] Calculated Columns dialog
- [ ] All dialogs use IAB protocol for communication
- [ ] All dialogs save to REST Configuration Service

### Phase 5: Layout Management (Week 10-11)
- [ ] Layout switcher UI
- [ ] Save as new layout
- [ ] Clone layout
- [ ] Delete layout
- [ ] Layout manager dialog

### Phase 6: Polish & Testing (Week 12)
- [ ] Performance optimization
- [ ] Error handling
- [ ] Comprehensive testing
- [ ] Documentation

---

## Key Files to Implement

### Configuration Management
```
client/src/services/configurationService.ts      # REST API wrapper
client/src/types/configuration.ts                # UnifiedConfig types (already exists)
```

### IAB Communication
```
client/src/services/openfin/IABService.ts       # IAB protocol implementation
client/src/types/iab-protocol.ts                # Message type definitions
```

### DataGrid Components
```
client/src/components/blotter/UniversalBlotter.tsx     # Main grid component
client/src/components/blotter/DataGrid.tsx             # AG-Grid wrapper
client/src/components/blotter/Toolbar/                 # Toolbar components
client/src/components/blotter/Toolbar/LayoutSelector.tsx
client/src/components/blotter/Toolbar/WindowActions.tsx
```

### Customization Dialogs
```
client/src/components/customization/ConditionalFormattingDialog.tsx
client/src/components/customization/ColumnGroupsDialog.tsx
client/src/components/customization/GridOptionsDialog.tsx
client/src/components/customization/CalculatedColumnsDialog.tsx
```

### Data Providers
```
client/src/services/data-providers/IDataProvider.ts
client/src/services/data-providers/StompProvider.ts
client/src/workers/stompSharedWorker.ts
```

---

## Architecture Diagrams

### Overall System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Configuration REST Service               │
│                    (Central Storage)                        │
│  - SQLite (development)                                     │
│  - MongoDB (production)                                     │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │ HTTP REST API
                         │
         ┌───────────────┼───────────────┬────────────────┐
         │               │               │                │
┌────────▼─────┐  ┌──────▼──────┐  ┌────▼────────┐  ┌────▼────────┐
│  Grid Win 1  │  │  Grid Win 2 │  │  Grid Win 3 │  │  Dialog Win │
│  (Main)      │  │  (Clone 1)  │  │  (Clone 2)  │  │             │
├──────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤
│ configId:    │  │ configId:   │  │ configId:   │  │ configId:   │
│ main         │  │ clone-1     │  │ clone-2     │  │ main        │
└──────┬───────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                 │                │                │
       └─────────────────┴────────────────┴────────────────┘
                         │
                   OpenFin IAB
                (Communication Layer)
                         │
       Topics: stern.config.updated
               stern.config.layout.switched
               stern.dialog.apply
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 STOMP/WebSocket Data Server                 │
│                 (Live Market Data)                          │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ WebSocket / STOMP
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  SharedWorker                               │
│                  (Data Streaming ONLY)                      │
│  - Connection pooling                                       │
│  - Data conflation                                          │
│  - Subscription management                                  │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ postMessage
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────▼─────┐  ┌──────▼──────┐  ┌────▼────────┐
│  Grid Win 1  │  │  Grid Win 2 │  │  Grid Win 3 │
│              │  │             │  │             │
│ Same data    │  │ Same data   │  │ Same data   │
│ Different    │  │ Different   │  │ Different   │
│ layout       │  │ layout      │  │ layout      │
└──────────────┘  └─────────────┘  └─────────────┘
```

---

## Important Distinctions

### SharedWorker Usage
✅ **USE SharedWorker FOR:**
- Real-time data streaming (STOMP, WebSocket)
- Connection pooling across multiple grid windows
- Data conflation and latency tracking
- Subscription management

❌ **DO NOT USE SharedWorker FOR:**
- Configuration updates (use OpenFin IAB)
- Dialog communication (use OpenFin IAB)
- Layout switching (use OpenFin IAB)
- Any configuration management (use REST API)

### Configuration vs Data
- **Configuration** = Grid settings, layouts, conditional formatting, column groups
  - Stored in: REST Configuration Service (SQLite/MongoDB)
  - Communicated via: OpenFin IAB
  - Persisted: Yes, in database

- **Data** = Live market data, trades, positions
  - Streamed from: STOMP/WebSocket server
  - Communicated via: SharedWorker
  - Persisted: No, real-time only

---

## Success Criteria

### Must Have
- [x] REST Configuration Service working
- [ ] OpenFin IAB protocol implemented and documented
- [ ] UniversalBlotter component displaying grid
- [ ] Window cloning functionality
- [ ] At least one customization dialog (Conditional Formatting)
- [ ] Layout management (save, switch, delete)
- [ ] Data provider connecting to STOMP

### Should Have
- [ ] All 4 customization dialogs implemented
- [ ] Multi-window sync working via IAB
- [ ] Performance optimizations
- [ ] Comprehensive error handling

### Nice to Have
- [ ] Advanced layout features (import/export)
- [ ] Configuration templates
- [ ] User preferences
- [ ] Analytics and usage tracking

---

**END OF IMPLEMENTATION PLAN**
