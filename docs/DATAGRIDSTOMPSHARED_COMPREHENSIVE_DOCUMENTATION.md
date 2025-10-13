# DataGridStompShared Component - Comprehensive Documentation

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Architecture](#architecture)
4. [Functional Features](#functional-features)
5. [UI Features](#ui-features)
6. [Dependencies](#dependencies)
7. [Dialog Boxes](#dialog-boxes)
8. [Hooks](#hooks)
9. [Configuration](#configuration)
10. [Services and Utilities](#services-and-utilities)
11. [Styling](#styling)
12. [Data Flow](#data-flow)
13. [Storage Architecture](#storage-architecture)

---

## Overview

**DataGridStompShared** is a sophisticated, modular data grid component built on AG-Grid Enterprise that provides real-time data visualization with STOMP protocol integration. It features a comprehensive profile management system, conditional formatting, calculated columns, column groups, and extensive customization options.

### Key Characteristics

- **Modular Architecture**: Hook-based design with separated concerns
- **Real-time Data**: STOMP WebSocket connection via SharedWorker for efficient multi-window support
- **Profile Management**: Full state persistence and versioning via Config Service
- **Advanced Customization**: Grid options, column groups, conditional formatting, calculated columns
- **Theme Support**: Light/dark mode with synchronized styling
- **Performance Optimized**: Ref-based state management, memoization, and batched updates

### Component Location

```
src/windows/datagrid/components/DataGridStompShared/
```

---

## Directory Structure

### Complete File Tree

```
src/windows/datagrid/components/DataGridStompShared/
├── index.tsx                                    # Main component entry point
├── types.ts                                     # TypeScript type definitions
├── CLEANUP_SUMMARY.md                           # Internal documentation
├── REFACTORING_SUMMARY.md                       # Internal documentation
│
├── calculatedColumns/                           # Calculated/Scratch Columns Feature
│   ├── CalculatedColumnsEditorContent.tsx      # Main editor UI component
│   ├── calculatedColumns.css                   # Styling for calculated columns
│   ├── gridCalculatedColumnsStorage.ts         # Storage service for calculated columns
│   └── index.ts                                # Module exports
│
├── columnGroups/                                # Column Groups Feature
│   ├── ColumnGroupEditor.tsx                   # Column group editor UI
│   ├── columnGroupService.ts                   # Service for applying groups to grid
│   ├── gridColumnGroupStorage.ts               # Storage service for column groups
│   ├── types.ts                                # Column group type definitions
│   └── index.ts                                # Module exports
│
├── components/                                  # UI Components
│   ├── BusyIndicator.tsx                       # Snapshot loading overlay
│   ├── ConnectionStatusPanel.tsx               # Grid status bar panel
│   ├── DataGrid.tsx                            # Main AG-Grid wrapper component
│   ├── ProfileStatusIndicator.tsx              # Profile save status indicator
│   └── Toolbar/                                # Toolbar components
│       ├── index.tsx                           # Main toolbar component
│       ├── ConnectionSection.tsx               # Connection controls
│       ├── ProfileSection.tsx                  # Profile management controls
│       ├── SettingsSection.tsx                 # Settings dropdown menu
│       └── StatusSection.tsx                   # Status indicators
│
├── conditionalFormatting/                       # Conditional Formatting Feature
│   ├── ConditionalFormattingEditorContent.tsx  # Main editor content
│   ├── ConditionalFormattingDialog.tsx         # Dialog wrapper
│   ├── RuleEditorSimplified.tsx                # Rule editor component
│   ├── gridConditionalFormattingStorage.ts     # Storage service for rules
│   ├── conditionalFormatting.css               # Main styling
│   ├── index.ts                                # Module exports
│   └── components/                             # Sub-components
│       ├── BorderStyleEditor.tsx               # Border styling controls
│       ├── TypographyEditor.tsx                # Text styling controls
│       ├── ShadcnFormatOptions.tsx             # Format options panel
│       ├── minimalStyles.css                   # Minimal theme styles
│       └── premiumStyles.css                   # Premium theme styles
│
├── config/                                      # Configuration Files
│   ├── constants.ts                            # Component constants
│   ├── gridConfig.ts                           # AG-Grid configuration
│   ├── gridOptions.ts                          # Grid options definitions (200+ options)
│   └── profileDefaults.ts                      # Default profile settings
│
├── gridOptions/                                 # Grid Options Editor Feature
│   ├── GridOptionsEditor.tsx                   # Main editor dialog
│   ├── GridOptionsPropertyGrid.tsx             # Property grid component
│   ├── gridOptionsConfig.ts                    # Options configuration
│   ├── NoPortalSelect.tsx                      # Non-portal select component
│   ├── PortalAwareSelect.tsx                   # Portal-aware select component
│   ├── PortalAwareTooltip.tsx                  # Portal-aware tooltip
│   └── styles.css                              # Editor styling
│
├── hooks/                                       # Custom React Hooks
│   ├── index.ts                                # Hook exports
│   ├── useColumnGroupManagement.ts             # Column group state management
│   ├── useConnectionManagement.ts              # STOMP connection management
│   ├── useDialogManagement.ts                  # Dialog open/close state
│   ├── useGridOptionsManagement.ts             # Grid options state
│   ├── useGridState.ts                         # Grid state management
│   ├── useIABManagement.ts                     # Inter-Application Bus integration
│   ├── useProfileApplication.ts                # Profile loading/applying
│   ├── useProfileOperations.ts                 # Profile save/delete operations
│   ├── useProviderConfig.ts                    # Provider configuration loading
│   ├── useSharedWorkerConnection.ts            # SharedWorker connection
│   ├── useSnapshotData.ts                      # Snapshot data handling
│   ├── useThemeSync.ts                         # Theme synchronization
│   └── useViewTitle.ts                         # Window title management
│
└── utils/                                       # Utility Modules
    └── gridStateManager.ts                     # Grid state serialization/restoration
```

### External Dependencies File Paths

#### Services (src/services/)
```
src/services/
├── channels/
│   ├── channelClient.ts                        # Channel communication client
│   ├── channelPublisher.ts                     # Channel publisher
│   ├── channelService.ts                       # Channel service singleton
│   └── channelSubscriber.ts                    # Channel subscriber
│
├── dataProviders/
│   ├── MockProvider.ts                         # Mock data provider
│   ├── ProviderRegistry.ts                     # Provider registration service
│   └── StompProvider.ts                        # STOMP data provider
│
├── iab/
│   └── GridConfigurationBus.ts                 # Inter-Application Bus for grid config
│
├── openfin/
│   └── OpenFinDialogService.ts                 # OpenFin dialog window management
│
├── sharedWorker/
│   ├── SharedWorkerClient.ts                   # SharedWorker client
│   └── types.ts                                # SharedWorker types
│
├── storage/
│   ├── adapters/
│   │   ├── EnhancedLocalStorageAdapter.ts     # Enhanced localStorage adapter
│   │   └── SimpleLocalStorageAdapter.ts       # Simple localStorage adapter
│   ├── interfaces/
│   │   └── IStorageAdapter.ts                 # Storage adapter interface
│   ├── config.ts                              # Storage configuration
│   ├── index.ts                               # Storage exports
│   ├── migration.ts                           # Storage migration utilities
│   ├── storageClient.ts                       # Storage client
│   ├── storageService.ts                      # Main storage service
│   └── types.ts                               # Storage types
│
├── stomp/
│   └── StompClient.ts                          # STOMP protocol client
│
├── template/
│   └── templateResolver.ts                     # Template resolution service
│
└── window/
    └── windowManager.ts                        # Window management service
```

#### Hooks (src/hooks/)
```
src/hooks/
├── useProfileManagement.ts                     # Profile management hook
└── use-toast.ts                                # Toast notification hook
```

#### Components (src/components/)
```
src/components/
├── ProfileManagementDialog.tsx                 # Profile management dialog
├── ProfileSelector.tsx                         # Profile selector component
├── ProfileSelectorSimple.tsx                   # Simple profile selector
├── RenameViewDialog.tsx                        # Rename view dialog
├── SaveProfileDialog.tsx                       # Save profile dialog
├── StorageMigrationDialog.tsx                  # Storage migration dialog
│
├── conditional-formatting/                     # Shared conditional formatting
│   └── components/
│       ├── ColorPicker.tsx                     # Color picker component
│       ├── IconPicker.tsx                      # Icon picker component
│       ├── PreviewPanel.tsx                    # Rule preview panel
│       ├── RuleEditor.tsx                      # Full rule editor
│       ├── RuleList.tsx                        # Rule list component
│       ├── RuleListItem.tsx                    # Individual rule item
│       └── RuleTemplates.tsx                   # Rule templates
│
├── expression-editor/                          # Expression/Formula Editor
│   ├── ExpressionEditor.tsx                    # Main editor component
│   ├── ExpressionEditorDialog.tsx              # Dialog wrapper
│   ├── ExpressionEditorDialogControlled.tsx    # Controlled dialog
│   └── components/
│       ├── ColumnsTab.tsx                      # Available columns tab
│       ├── ExamplesTab.tsx                     # Expression examples
│       ├── FunctionsTab.tsx                    # Available functions
│       ├── HistoryTab.tsx                      # Expression history
│       ├── InlineStyleEditor.tsx               # Inline style editor
│       ├── PreviewPanel.tsx                    # Expression preview
│       ├── ValidationPanel.tsx                 # Validation results
│       └── VariablesTab.tsx                    # Available variables
│
├── theme-provider.tsx                          # Theme context provider
├── theme-toggle.tsx                            # Theme toggle component
│
└── ui/                                         # Shadcn UI Components
    ├── accordion.tsx                           # Accordion component
    ├── alert-dialog.tsx                        # Alert dialog
    ├── alert.tsx                               # Alert component
    ├── badge.tsx                               # Badge component
    ├── button.tsx                              # Button component
    ├── calendar.tsx                            # Calendar component
    ├── card.tsx                                # Card component
    ├── checkbox.tsx                            # Checkbox component
    ├── collapsible.tsx                         # Collapsible component
    ├── command.tsx                             # Command palette
    ├── context-menu.tsx                        # Context menu
    ├── dialog.tsx                              # Dialog component
    ├── draggable-dialog.tsx                    # Draggable dialog
    ├── dropdown-menu.tsx                       # Dropdown menu
    ├── input.tsx                               # Input component
    ├── label.tsx                               # Label component
    ├── menubar.tsx                             # Menubar component
    ├── multi-select.tsx                        # Multi-select component
    ├── popover.tsx                             # Popover component
    ├── radio-group.tsx                         # Radio group
    ├── resizable.tsx                           # Resizable panels
    ├── scroll-area.tsx                         # Scroll area
    ├── select.tsx                              # Select component
    ├── separator.tsx                           # Separator component
    ├── sheet.tsx                               # Sheet component
    ├── slider.tsx                              # Slider component
    ├── switch.tsx                              # Switch component
    ├── table.tsx                               # Table component
    ├── tabs.tsx                                # Tabs component
    ├── textarea.tsx                            # Textarea component
    ├── toast.tsx                               # Toast notification
    ├── toaster.tsx                             # Toast container
    ├── toggle-group.tsx                        # Toggle group
    ├── toggle.tsx                              # Toggle component
    ├── tooltip.tsx                             # Tooltip component
    │
    └── openfin/                                # OpenFin-specific UI
        ├── openfin-alert-dialog.tsx            # OpenFin alert dialog
        ├── openfin-command.tsx                 # OpenFin command palette
        ├── openfin-context-menu.tsx            # OpenFin context menu
        ├── openfin-dialog.tsx                  # OpenFin dialog
        ├── openfin-dropdown-menu.tsx           # OpenFin dropdown
        ├── openfin-menubar.tsx                 # OpenFin menubar
        ├── openfin-popover.tsx                 # OpenFin popover
        ├── openfin-select.tsx                  # OpenFin select
        ├── openfin-sheet.tsx                   # OpenFin sheet
        └── openfin-tooltip.tsx                 # OpenFin tooltip
```

### Key File Responsibilities

#### Core Component Files
- **index.tsx**: Main component orchestrator that composes all hooks and renders UI
- **types.ts**: All TypeScript interfaces used throughout the component
- **config/**: Static configuration files for grid setup, defaults, and constants

#### Feature Modules
- **calculatedColumns/**: Formula-based computed columns with Monaco editor
- **columnGroups/**: Hierarchical column organization with expand/collapse
- **conditionalFormatting/**: Expression-based cell styling with visual rule builder
- **gridOptions/**: Interface for 200+ AG-Grid configuration options

#### Hooks (Business Logic)
- **useSharedWorkerConnection.ts**: Manages WebSocket connection via SharedWorker
- **useSnapshotData.ts**: Handles snapshot loading and real-time update accumulation
- **useGridState.ts**: Manages grid state (columns, filters, sorting, grouping)
- **useProfileOperations.ts**: Save/load/delete profile operations
- **useConnectionManagement.ts**: Connection lifecycle and state management

#### UI Components
- **Toolbar/**: Multi-section toolbar with all user controls
- **DataGrid.tsx**: AG-Grid wrapper with configuration and theming
- **BusyIndicator.tsx**: Loading overlay during snapshot phase

#### Storage Services
- **gridCalculatedColumnsStorage.ts**: Persist calculated column definitions
- **gridColumnGroupStorage.ts**: Persist column group configurations
- **gridConditionalFormattingStorage.ts**: Persist formatting rules

---

## Architecture

### Component Structure

The component follows a modular architecture with clear separation of concerns:

```
DataGridStompShared/
├── index.tsx                    # Main component orchestrator
├── types.ts                     # TypeScript interfaces and types
├── config/                      # Configuration constants
│   ├── constants.ts            # Component constants
│   ├── gridConfig.ts           # AG-Grid configuration
│   ├── gridOptions.ts          # Grid options definitions
│   └── profileDefaults.ts      # Default profile settings
├── hooks/                       # Custom React hooks
│   ├── useSharedWorkerConnection.ts
│   ├── useSnapshotData.ts
│   ├── useProviderConfig.ts
│   ├── useGridState.ts
│   ├── useViewTitle.ts
│   ├── useThemeSync.ts
│   ├── useDialogManagement.ts
│   ├── useProfileOperations.ts
│   ├── useConnectionManagement.ts
│   ├── useProfileApplication.ts
│   ├── useIABManagement.ts
│   ├── useColumnGroupManagement.ts
│   └── useGridOptionsManagement.ts
├── components/                  # UI components
│   ├── Toolbar/
│   │   ├── index.tsx
│   │   ├── ProfileSection.tsx
│   │   ├── ConnectionSection.tsx
│   │   ├── StatusSection.tsx
│   │   └── SettingsSection.tsx
│   ├── BusyIndicator.tsx
│   ├── DataGrid.tsx
│   ├── ConnectionStatusPanel.tsx
│   └── ProfileStatusIndicator.tsx
├── gridOptions/                 # Grid options editor
│   ├── GridOptionsEditor.tsx
│   ├── GridOptionsPropertyGrid.tsx
│   ├── gridOptionsConfig.ts
│   ├── NoPortalSelect.tsx
│   ├── PortalAwareTooltip.tsx
│   └── styles.css
├── columnGroups/               # Column groups feature
│   ├── ColumnGroupEditor.tsx
│   ├── columnGroupService.ts
│   ├── gridColumnGroupStorage.ts
│   └── types.ts
├── conditionalFormatting/      # Conditional formatting feature
│   ├── ConditionalFormattingEditorContent.tsx
│   ├── ConditionalFormattingDialog.tsx
│   ├── RuleEditorSimplified.tsx
│   ├── gridConditionalFormattingStorage.ts
│   ├── conditionalFormatting.css
│   └── components/
│       ├── BorderStyleEditor.tsx
│       ├── TypographyEditor.tsx
│       └── ShadcnFormatOptions.tsx
├── calculatedColumns/          # Calculated columns feature
│   ├── CalculatedColumnsEditorContent.tsx
│   ├── gridCalculatedColumnsStorage.ts
│   └── calculatedColumns.css
└── utils/
    └── gridStateManager.ts     # Grid state persistence utility
```

### Design Principles

1. **Hook-based Architecture**: All logic encapsulated in custom hooks for reusability and testability
2. **Ref-based State**: Uses refs for non-UI state to prevent unnecessary re-renders
3. **Stable References**: Callbacks and objects memoized with `useCallback` and `useMemo`
4. **Performance First**: Minimal re-renders through careful dependency management
5. **Separation of Concerns**: Each hook/component has a single, well-defined responsibility

---

## Functional Features

### 1. STOMP Connection Management

#### SharedWorker Architecture

The DataGridStompShared component uses a **SharedWorker** to efficiently manage WebSocket connections across multiple grid instances. This architecture provides significant performance and resource benefits.

##### Why SharedWorker?

**Problem Without SharedWorker:**
- Each grid instance creates its own WebSocket connection
- 10 grids = 10 separate connections to the same STOMP server
- High memory usage, connection overhead, and server load
- Duplicate data received by each connection

**Solution With SharedWorker:**
- Single SharedWorker process manages all STOMP connections
- Multiple grid instances (tabs/windows) connect to the same SharedWorker
- SharedWorker maintains ONE WebSocket connection per provider
- Data is cached in SharedWorker and distributed to all subscribers
- **90% reduction in memory usage and connection overhead**

##### SharedWorker Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Environment                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Grid Tab 1 │  │  Grid Tab 2 │  │  Grid Tab 3 │         │
│  │             │  │             │  │             │         │
│  │ SWClient 1  │  │ SWClient 2  │  │ SWClient 3  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                 │                 │                │
│         │   MessagePort   │   MessagePort   │                │
│         └────────┬────────┴────────┬────────┘                │
│                  │                 │                         │
│         ┌────────▼─────────────────▼────────┐                │
│         │    SharedWorker (stompSharedWorker.ts)            │
│         │                                    │                │
│         │  ┌──────────────────────────┐    │                │
│         │  │   Provider Connections    │    │                │
│         │  │   Map<string, Provider>   │    │                │
│         │  │                            │    │                │
│         │  │  provider-1:               │    │                │
│         │  │    - connection (STOMP)   │    │                │
│         │  │    - snapshot (Map)       │    │                │
│         │  │    - subscribers (Set)    │    │                │
│         │  │    - statistics           │    │                │
│         │  │                            │    │                │
│         │  │  provider-2: ...          │    │                │
│         │  └──────────┬─────────────────┘    │                │
│         │             │                     │                │
│         └─────────────┼─────────────────────┘                │
│                       │                                       │
│                       │ WebSocket                             │
└───────────────────────┼───────────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   STOMP Server    │
              │                   │
              │  - WebSocket      │
              │  - Topics         │
              │  - Data Streams   │
              └───────────────────┘
```

##### SharedWorker Components

**1. SharedWorkerClient (Browser Side)**
- **Location**: `src/services/sharedWorker/SharedWorkerClient.ts`
- **Purpose**: Client-side API for communicating with SharedWorker
- **Features**:
  - Connects to SharedWorker via MessagePort
  - Sends requests (subscribe, unsubscribe, getSnapshot, getStatus)
  - Receives events (snapshot, update, status, error)
  - Manages pending requests with timeout handling
  - Event-based communication using EventEmitter

**2. stompSharedWorker (Worker Side)**
- **Location**: `src/workers/stompSharedWorker.ts`
- **Purpose**: Background worker managing STOMP connections
- **Features**:
  - Runs in separate thread (isolated from main UI)
  - Manages multiple provider connections simultaneously
  - Maintains snapshot cache for each provider
  - Broadcasts updates to all subscribers
  - Automatic cleanup when no subscribers remain

##### SharedWorker Communication Protocol

**Request/Response Types:**

```typescript
// Request Types (from client to worker)
type WorkerRequestType =
  | 'subscribe'      // Subscribe to a provider
  | 'unsubscribe'    // Unsubscribe from a provider
  | 'getSnapshot'    // Get current snapshot data
  | 'getStatus';     // Get connection status

// Response Types (from worker to client)
type WorkerResponseType =
  | 'subscribed'     // Subscription confirmation
  | 'unsubscribed'   // Unsubscription confirmation
  | 'snapshot'       // Snapshot data
  | 'update'         // Real-time update data
  | 'status'         // Status update
  | 'error';         // Error message

// Request Structure
interface WorkerRequest {
  type: WorkerRequestType;
  providerId: string;
  requestId: string;     // Unique request ID for matching responses
  portId: string;        // Client port identifier
  config?: any;          // Provider configuration (for subscribe)
}

// Response Structure
interface WorkerResponse {
  type: WorkerResponseType;
  providerId: string;
  requestId?: string;    // Matches original request
  data?: any[];          // Data payload (for snapshot/update)
  statistics?: any;      // Connection statistics
  error?: string;        // Error message (for errors)
  timestamp: number;     // Response timestamp
}
```

##### Provider Connection State in SharedWorker

Each provider managed by the SharedWorker maintains:

```typescript
interface ProviderConnection {
  providerId: string;                           // Unique provider ID
  config: Record<string, unknown>;              // Provider configuration
  snapshot: Map<string, Record<string, unknown>>; // Cached snapshot data (keyed)
  lastUpdate: number;                           // Timestamp of last update
  subscribers: Map<string, MessagePort>;        // Active subscribers
  connection: StompClient | null;               // STOMP connection instance
  statistics: {
    snapshotRowsReceived: number;
    updateRowsReceived: number;
    connectionCount: number;
    disconnectionCount: number;
    isConnected: boolean;
    bytesReceived: number;
    snapshotBytesReceived: number;
    updateBytesReceived: number;
    mode: 'idle' | 'snapshot' | 'realtime';
  };
  isConnecting: boolean;                        // Connection in progress
  isSnapshotComplete: boolean;                  // Snapshot phase complete
  pendingSnapshotRequests: Array<{              // Queued snapshot requests
    port: MessagePort;
    request: WorkerRequest;
  }>;
  error?: string;                               // Last error message
}
```

##### SharedWorker Connection Flow

**1. Grid Instance Initialization**
```typescript
// In useSharedWorkerConnection.ts
const client = new SharedWorkerClient({
  workerUrl: '/src/workers/stompSharedWorker.ts',
  reconnectInterval: 5000,
  requestTimeout: 30000
});

await client.connect(); // Establishes MessagePort connection
```

**2. Provider Subscription**
```typescript
// Subscribe to a provider
await client.subscribe(providerId, {
  websocketUrl: 'ws://localhost:8080/stomp',
  listenerTopic: '/topic/data',
  requestMessage: '/app/snapshot',
  snapshotEndToken: 'END',
  keyColumn: 'id'
});
```

**3. SharedWorker Actions**
- Creates or retrieves provider connection
- Adds subscriber's MessagePort to provider's subscriber list
- Connects to STOMP server if not already connected
- Starts receiving data

**4. Data Flow**
```
STOMP Server → SharedWorker → Broadcast → All Subscribers
```

**5. Snapshot Request**
```typescript
// Client requests snapshot
const data = await client.getSnapshot(providerId);
// Returns cached snapshot immediately if available
// Or queues request until snapshot is complete
```

##### SharedWorker Event System

**Events Emitted by SharedWorkerClient:**

```typescript
// Connection events
client.on('connected', () => {
  console.log('Connected to SharedWorker');
});

client.on('disconnected', () => {
  console.log('Disconnected from SharedWorker');
});

// Data events
client.on('snapshot', ({ providerId, data, statistics }) => {
  console.log(`Snapshot received: ${data.length} rows`);
  // Handle snapshot data
});

client.on('update', ({ providerId, data, statistics }) => {
  console.log(`Update received: ${data.length} rows`);
  // Handle real-time updates
});

client.on('status', ({ providerId, statistics }) => {
  console.log('Status update:', statistics);
  // Handle status changes
});

client.on('error', (error) => {
  console.error('Error:', error);
  // Handle errors
});
```

##### Snapshot Caching Strategy

The SharedWorker maintains an in-memory cache of snapshot data:

**1. Initial Snapshot**
- STOMP server sends snapshot data in batches
- SharedWorker accumulates data in Map (keyed by keyColumn)
- Broadcasts each batch to all subscribers
- When end token received, marks snapshot as complete

**2. Real-time Updates**
- Updates applied to cached snapshot
- Updated rows replace existing rows in Map
- Broadcasts updates to all subscribers
- Cache always reflects current state

**3. New Subscriber Joins**
- If snapshot complete: immediately receives cached data via getSnapshot()
- If snapshot in progress: request queued until completion
- No need to request new snapshot from server

**Benefits:**
- New subscribers get instant data from cache
- Reduced server load (one snapshot per provider)
- Consistent data across all grid instances
- Automatic cache updates with real-time data

##### Resource Management

**1. Automatic Cleanup**
```typescript
// When last subscriber unsubscribes
if (provider.subscribers.size === 0) {
  console.log('No more subscribers, disconnecting provider');
  provider.connection?.disconnect();
  providers.delete(providerId);
}
```

**2. Port Management**
```typescript
// Track all ports
const ports = new Map<string, MessagePort>();

// Clean up on port close
port.addEventListener('close', () => {
  providers.forEach(provider => {
    provider.subscribers.delete(portId);
  });
  ports.delete(portId);
});
```

**3. Memory Efficiency**
- Snapshot stored once in SharedWorker
- Multiple subscribers reference same data
- Old updates don't accumulate (Map overwrites)
- Automatic garbage collection when provider deleted

##### Error Handling

**Connection Errors:**
```typescript
connection.on('error', (error) => {
  broadcastToSubscribers(providerId, {
    type: 'error',
    providerId,
    error: error.message,
    timestamp: Date.now()
  });
});
```

**Request Timeout:**
```typescript
const timeout = setTimeout(() => {
  pendingRequests.delete(requestId);
  reject(new Error(`Request timeout: ${type} for ${providerId}`));
}, config.requestTimeout);
```

**WebSocket Disconnection:**
```typescript
connection.on('disconnected', () => {
  provider.statistics.isConnected = false;
  provider.isSnapshotComplete = false;
  broadcastToSubscribers(providerId, {
    type: 'status',
    providerId,
    statistics: provider.statistics,
    timestamp: Date.now()
  });
});
```

##### Performance Characteristics

**Without SharedWorker:**
- 10 grids = 10 WebSocket connections
- 10 × snapshot data = 10 × memory
- 10 × update messages received
- Browser: ~500MB memory usage

**With SharedWorker:**
- 10 grids = 1 WebSocket connection
- 1 × snapshot data (cached)
- 1 × update messages received (then broadcast)
- Browser: ~50MB memory usage (90% reduction)

##### useSharedWorkerConnection Hook

The `useSharedWorkerConnection` hook provides a clean React interface to the SharedWorker:

```typescript
const {
  connectionState,   // Current connection state
  workerClient,      // SharedWorkerClient instance
  connect,           // Connect to provider
  disconnect,        // Disconnect from provider
  subscribe,         // Subscribe to provider
  unsubscribe        // Unsubscribe from provider
} = useSharedWorkerConnection(selectedProviderId, gridApiRef);
```

**Features:**
- Initializes SharedWorkerClient on mount
- Manages connection state (isConnected, isConnecting, etc.)
- Updates AG-Grid context with connection status
- Handles toast notifications for errors
- Provides stable callback functions (useCallback)
- Cleanup on unmount

#### Connection Lifecycle

```
Grid Component Initialization
       │
       ▼
Create SharedWorkerClient
       │
       ▼
Connect to SharedWorker (MessagePort)
       │
       ▼
Subscribe to Provider (with config)
       │
       ▼
SharedWorker: Get or Create Provider
       │
       ▼
SharedWorker: Connect to STOMP Server
       │
       ▼
SharedWorker: Request Snapshot
       │
       ▼
SharedWorker: Receive Snapshot Batches
       │
       ▼
SharedWorker: Cache & Broadcast Batches
       │
       ▼
Grid: Accumulate Snapshot Data
       │
       ▼
SharedWorker: Snapshot Complete
       │
       ▼
Grid: Display Complete Data
       │
       ▼
SharedWorker: Switch to Real-time Mode
       │
       ▼
SharedWorker: Receive & Broadcast Updates
       │
       ▼
Grid: Apply Transaction Updates
```

#### Connection State

```typescript
interface ConnectionState {
  isConnected: boolean;              // Currently connected to provider
  currentClientId: string;           // Client identifier
  isConnecting: boolean;             // Connection in progress
  wasManuallyDisconnected: boolean;  // User initiated disconnect
  hasShownDisconnectAlert: boolean;  // Disconnect alert shown
}
```

#### SharedWorker Features Summary

1. **Resource Efficiency**: Single connection shared across multiple instances
2. **Data Caching**: In-memory snapshot cache for instant access
3. **Automatic Updates**: Real-time updates applied to cache and broadcast
4. **Smart Queueing**: Pending requests served when snapshot completes
5. **Auto-Cleanup**: Resources freed when no subscribers remain
6. **Error Recovery**: Connection errors broadcast to all subscribers
7. **Type Safety**: Full TypeScript support with strong typing
8. **Event-Driven**: EventEmitter-based communication pattern
9. **Request/Response**: Async request handling with timeout protection
10. **Statistics Tracking**: Comprehensive metrics for monitoring

---

### 1b. Data Provider Architecture

#### Overview

The DataGridStompShared component uses a **pluggable data provider architecture** to separate the data source layer from the UI layer. This architecture currently supports STOMP providers but is designed to accommodate multiple provider types.

#### ⚠️ Current State: Tight Coupling Issue

**Critical Architectural Concern:**
The current implementation has **tight coupling** between the DataGrid component and the STOMP data provider. This creates significant limitations for supporting other data sources.

**Problems with Current Architecture:**
1. **Grid-Specific Dependencies**: STOMP provider includes AG-Grid column definitions (`ColDef`)
2. **Inferred Schema**: Provider infers column structure from data (assumes JSON objects)
3. **Single Protocol**: Only STOMP WebSocket protocol currently supported
4. **Limited Reusability**: Cannot use the same provider for non-grid use cases
5. **Hard-coded Assumptions**: Assumes snapshot/real-time pattern specific to STOMP
6. **No Separation of Concerns**: Data fetching logic mixed with UI structure

**Future Architecture Goal:**
> ⭐ **The data providers MUST be completely independent of the grid component**, enabling the same provider to be used with different UIs (tables, charts, lists) or even non-UI use cases (data export, analytics, logging).

#### Data Provider Interface (IDataProvider)

All data providers must implement this standardized interface:

**Location:** `src/types/dataProvider.ts`

```typescript
export interface IDataProvider {
  // Identity
  readonly id: string;                         // Unique provider ID
  readonly type: ProviderType;                 // Provider type

  // Connection management
  connect(): Promise<void>;                    // Establish connection
  disconnect(): Promise<void>;                 // Close connection
  readonly connectionState: ConnectionState;   // Current connection state

  // Data access
  readonly columnDefs: ColDef[];               // ⚠️ PROBLEM: AG-Grid specific!
  readonly rowData: any[];                     // Raw data rows
  requestSnapshot(): Promise<void>;            // Request initial data load

  // Event system (EventEmitter-based)
  on(event: 'snapshot' | 'update' | 'connected' | 'disconnected' | 'error',
     handler: (data: any) => void): void;
  off(event: 'snapshot' | 'update' | 'connected' | 'disconnected' | 'error',
      handler: (data: any) => void): void;

  // Statistics and monitoring
  readonly statistics: ProviderStatistics;

  // Cleanup
  destroy(): void;
}
```

**Issue with Current Interface:**
- ❌ `columnDefs: ColDef[]` is AG-Grid specific
- ✅ Should be: `schema: DataSchema` (generic schema adaptable to any UI)

```typescript
// Connection states
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

// Provider types
export type ProviderType =
  | 'stomp'      // STOMP WebSocket (implemented)
  | 'rest'       // REST API (planned)
  | 'websocket'  // Vanilla WebSocket (planned)
  | 'mock';      // Mock data for testing (implemented)

// Provider statistics
export interface ProviderStatistics {
  snapshotRowsReceived: number;
  updateRowsReceived: number;
  bytesReceived: number;
  lastMessageTime: number | null;
  isConnected: boolean;
  mode: 'idle' | 'snapshot' | 'realtime';
  connectionDuration?: number;
  errorCount?: number;
}
```

#### Provider Registry System

The ProviderRegistry enables **dynamic loading** and **lifecycle management** of data providers.

**Location:** `src/services/dataProviders/ProviderRegistry.ts`

```typescript
class ProviderRegistry {
  private factories = new Map<ProviderType, ProviderFactory>();
  private instances = new Map<string, IDataProvider>();

  // Register provider factory (lazy loading)
  register(type: ProviderType, factory: ProviderFactory): void;

  // Create or reuse provider instance
  async create(config: ProviderConfig): Promise<IDataProvider>;

  // Get existing provider
  get(providerId: string): IDataProvider | undefined;

  // Cleanup
  async destroy(providerId: string): Promise<void>;
  async destroyAll(): Promise<void>;

  // Introspection
  hasFactory(type: ProviderType): boolean;
  getRegisteredTypes(): ProviderType[];
  getActiveProviders(): string[];
}

// Singleton instance
export const providerRegistry = new ProviderRegistry();
```

**Registered Providers:**

```typescript
// STOMP Provider (✅ Implemented)
providerRegistry.register('stomp', async (config) => {
  const { StompProvider } = await import('./StompProvider');
  return new StompProvider(config);
});

// Mock Provider (✅ Implemented - for testing)
providerRegistry.register('mock', async (config) => {
  const { MockProvider } = await import('./MockProvider');
  return new MockProvider(config);
});

// REST Provider (❌ Not yet implemented)
providerRegistry.register('rest', async (config) => {
  throw new Error('REST provider not yet implemented');
});

// WebSocket Provider (❌ Not yet implemented)
providerRegistry.register('websocket', async (config) => {
  throw new Error('WebSocket provider not yet implemented');
});
```

#### STOMP Provider Implementation

**Location:** `src/services/dataProviders/StompProvider.ts`

The STOMP provider handles STOMP-over-WebSocket connections with snapshot and real-time update capabilities.

##### Configuration Interface

```typescript
export interface StompProviderConfig extends ProviderConfig {
  providerType: 'stomp';
  websocketUrl: string;           // WebSocket URL (e.g., 'ws://localhost:8080/stomp')
  listenerTopic: string;          // Topic to subscribe to
  requestMessage?: string;        // Topic to send snapshot request
  requestBody?: string;           // Body of snapshot request
  snapshotEndToken?: string;      // Token indicating end of snapshot
  keyColumn?: string;             // Key field for row identification
  snapshotTimeoutMs?: number;     // Snapshot timeout (default: 60000ms)
  manualTopics?: boolean;         // Enable template resolution
}
```

##### Configuration Example

```json
{
  "providerId": "positions-feed",
  "providerType": "stomp",
  "websocketUrl": "ws://localhost:8080/stomp",
  "listenerTopic": "/snapshot/positions/{clientId}",
  "requestMessage": "/snapshot/positions/{clientId}/1000",
  "requestBody": "{}",
  "snapshotEndToken": "SUCCESS",
  "keyColumn": "positionId",
  "snapshotTimeoutMs": 60000,
  "manualTopics": true
}
```

##### Template Resolution

When `manualTopics: true`, template variables are resolved:

**Template Service:** `src/services/template/templateResolver.ts`

```typescript
// Before resolution
listenerTopic: '/snapshot/positions/{clientId}'
requestMessage: '/snapshot/positions/{clientId}/1000'

// After resolution (with sessionId = 'abc-123-def')
listenerTopic: '/snapshot/positions/abc-123-def'
requestMessage: '/snapshot/positions/abc-123-def/1000'
```

**Available Template Variables:**
- `{clientId}` - Unique session ID (UUID v4)

##### STOMP Provider Lifecycle

**1. Connect to STOMP Server**
```typescript
await provider.connect();
```
**Actions:**
- Creates `@stomp/stompjs` Client
- Connects to WebSocket broker
- Sets up error handlers
- Configures heartbeat (4s incoming/outgoing)
- Emits `'connected'` event

**2. Request Snapshot**
```typescript
await provider.requestSnapshot();
```
**Actions:**
- Sets mode to `'snapshot'`
- Emits `'REQUESTING_SNAPSHOT_DATA'` event
- Resolves topic templates (if `manualTopics: true`)
- Subscribes to `listenerTopic`
- Sends request message to `requestMessage` (if configured)
- Accumulates data batches
- Waits for `snapshotEndToken`
- Infers column definitions from first row
- Emits `'SNAPSHOT_COMPLETE'` event
- Emits `'snapshot'` event with all data
- Switches mode to `'realtime'`

**3. Receive Real-time Updates**
```typescript
provider.on('update', ({ updates }) => {
  // Handle real-time data updates
});
```
**Actions:**
- Continues listening on `listenerTopic`
- Emits `'update'` event for each batch
- Updates statistics

**4. Disconnect**
```typescript
await provider.disconnect();
```
**Actions:**
- Unsubscribes from all topics
- Deactivates STOMP client
- Cleans up resources
- Emits `'disconnected'` event

##### STOMP Provider Events

```typescript
// Connection events
provider.on('connected', () => {
  console.log('Connected to STOMP server');
});

provider.on('disconnected', () => {
  console.log('Disconnected from STOMP server');
});

provider.on('connectionStateChanged', (state: ConnectionState) => {
  console.log('Connection state:', state);
});

// Snapshot lifecycle events
provider.on('REQUESTING_SNAPSHOT_DATA', () => {
  console.log('Requesting snapshot data...');
});

provider.on('SNAPSHOT_COMPLETE', ({ rowCount, duration }) => {
  console.log(`Snapshot complete: ${rowCount} rows in ${duration}ms`);
});

// Data events
provider.on('snapshot', ({ rows, columnDefs }) => {
  console.log(`Snapshot: ${rows.length} rows, ${columnDefs.length} columns`);
  // rows: any[]
  // columnDefs: ColDef[] (AG-Grid specific)
});

provider.on('update', ({ updates }) => {
  console.log(`Update: ${updates.length} rows`);
  // updates: any[]
});

// Error events
provider.on('error', (error: Error) => {
  console.error('Provider error:', error.message);
});
```

##### Column Definition Inference

The STOMP provider **infers column definitions** from the first data row:

```typescript
private inferColumnDefs(sampleRow: any): ColDef[] {
  const columns: ColDef[] = [];

  Object.keys(sampleRow).forEach(key => {
    columns.push({
      field: key,
      headerName: key,
      sortable: true,
      filter: true,
      resizable: true
    });
  });

  return columns;
}
```

**Issue:**
- ❌ Creates AG-Grid specific `ColDef[]`
- ❌ Simple inference (doesn't detect data types)
- ❌ No support for custom column metadata
- ✅ Should create generic schema instead

#### StompClient (Low-Level Implementation)

**Location:** `src/services/stomp/StompClient.ts`

Used by SharedWorker for lower-level STOMP operations.

##### Configuration

```typescript
export interface StompClientConfig {
  websocketUrl: string;
  dataType?: 'positions' | 'trades';  // Affects auto-generated topics
  messageRate?: number;               // Message rate in ms (default: 1000)
  batchSize?: number;                 // Batch size for snapshot
  snapshotEndToken?: string;
  keyColumn?: string;
  snapshotTimeoutMs?: number;
}
```

##### Auto-Generated Topics

Unlike StompProvider, StompClient auto-generates topics:

```typescript
// Listener topic
const listenerTopic = `/snapshot/${dataType}/${clientId}`;
// Example: /snapshot/positions/client-1234567890-abcd

// Trigger destination
const triggerDestination = `/snapshot/${dataType}/${clientId}/${messageRate}/${batchSize}`;
// Example: /snapshot/positions/client-1234567890-abcd/1000/100
```

##### Usage Example

```typescript
import { StompClient } from '@/services/stomp/StompClient';

const client = new StompClient({
  websocketUrl: 'ws://localhost:8080/stomp',
  dataType: 'positions',
  messageRate: 1000,
  batchSize: 100,
  snapshotEndToken: 'SUCCESS',
  keyColumn: 'id'
});

// Connect and auto-subscribe
await client.connect();

// Listen for data
client.on('data', (rows: any[]) => {
  console.log(`Received ${rows.length} rows`);
});

// Listen for snapshot completion
client.on('snapshot-complete', ({ rowCount, duration }) => {
  console.log(`Snapshot: ${rowCount} rows in ${duration}ms`);
});

// Disconnect
client.disconnect();
```

#### Architectural Problems & Proposed Solutions

##### Problem 1: AG-Grid Dependency in Provider

**Current:**
```typescript
export interface IDataProvider {
  readonly columnDefs: ColDef[];  // ❌ AG-Grid specific
  readonly rowData: any[];
}
```

**Proposed Solution:**
```typescript
export interface IDataProvider {
  readonly schema: DataSchema;    // ✅ Generic schema
  readonly data: any[];
}

// Generic schema definition
interface DataSchema {
  fields: FieldDefinition[];
  primaryKey?: string;
  version?: string;
}

interface FieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  nullable?: boolean;
  format?: string;          // e.g., 'currency', 'percentage', 'iso-date'
  description?: string;
  defaultValue?: any;
}

// Adapter pattern for AG-Grid
function schemaToColDefs(schema: DataSchema): ColDef[] {
  return schema.fields.map(field => ({
    field: field.name,
    headerName: field.name,
    type: mapTypeToAgGrid(field.type),
    valueFormatter: getFormatterForFormat(field.format),
    // ... map other properties
  }));
}
```

**Benefits:**
- ✅ Provider independent of UI framework
- ✅ Schema can be adapted to any UI (AG-Grid, charts, tables)
- ✅ Explicit type information (not inferred)
- ✅ Supports metadata (descriptions, formats)

##### Problem 2: Snapshot/Real-time Assumptions

**Current Issue:**
All providers assume snapshot + real-time pattern. Not all data sources work this way.

**Different Data Source Patterns:**
1. **REST API**: Polling or cursor-based pagination
2. **WebSocket (vanilla)**: May only have real-time (no snapshot)
3. **CSV File**: Single load, no updates
4. **SSE (Server-Sent Events)**: Real-time only
5. **GraphQL**: Query + subscriptions

**Proposed Solution - Capability System:**
```typescript
export interface IDataProvider {
  readonly capabilities: ProviderCapabilities;

  // Optional methods based on capabilities
  requestSnapshot?(): Promise<void>;
  subscribeToUpdates?(): void;
  unsubscribeFromUpdates?(): void;
  poll?(interval: number): void;
  stopPolling?(): void;
}

interface ProviderCapabilities {
  hasSnapshot: boolean;       // Supports initial bulk load
  hasRealtime: boolean;       // Supports real-time updates
  hasPagination: boolean;     // Supports pagination
  hasFiltering: boolean;      // Supports server-side filtering
  hasSorting: boolean;        // Supports server-side sorting
  hasSearch: boolean;         // Supports server-side search
  maxRowsPerRequest?: number; // Maximum rows per request
}
```

**Example Usage:**
```typescript
if (provider.capabilities.hasSnapshot) {
  await provider.requestSnapshot!();
}

if (provider.capabilities.hasRealtime) {
  provider.subscribeToUpdates!();
}

if (provider.capabilities.hasPagination) {
  // Show pagination controls
}
```

##### Problem 3: Provider Configuration Storage

**Current Issue:**
- Provider configurations stored WITH grid profiles
- Tight coupling between provider and grid
- Cannot share providers across components

**Proposed Solution - Separate Provider Configs:**
```typescript
// Separate provider storage
{
  "providers": {
    "positions-feed": {
      "type": "stomp",
      "websocketUrl": "ws://localhost:8080/stomp",
      "listenerTopic": "/topic/positions",
      ...
    },
    "trades-api": {
      "type": "rest",
      "baseUrl": "https://api.example.com",
      "endpoint": "/trades",
      ...
    }
  }
}

// Grid profile references provider by ID
{
  "profileName": "Trading Grid",
  "providerId": "positions-feed",  // Reference to provider
  "columnState": {...},
  "filterModel": {...}
}
```

**Benefits:**
- ✅ One provider used by multiple components
- ✅ Centralized provider management
- ✅ Easy to switch data sources
- ✅ Provider sharing and reuse

##### Problem 4: Single UI Support

**Current State:**
```
StompProvider → DataGridStompShared (1:1 coupling)
```

**Desired State (Adapter Pattern):**
```
                ┌─→ DataGridStompShared (via GridAdapter)
                │
StompProvider ──┼─→ ChartComponent (via ChartAdapter)
                │
                ├─→ ListComponent (via ListAdapter)
                │
                └─→ ExportService (no adapter needed)
```

**Implementation:**
```typescript
// Generic provider
const provider = await providerRegistry.create(config);

// Different adapters for different UIs
class GridDataAdapter {
  constructor(private provider: IDataProvider) {}

  getColumnDefs(): ColDef[] {
    return schemaToColDefs(this.provider.schema);
  }

  getRowData(): any[] {
    return this.provider.data;
  }
}

class ChartDataAdapter {
  constructor(private provider: IDataProvider) {}

  getSeries(): ChartSeries[] {
    return dataToSeries(this.provider.data, this.provider.schema);
  }
}

// Usage
const gridAdapter = new GridDataAdapter(provider);
const chartAdapter = new ChartDataAdapter(provider);

<AgGridReact columnDefs={gridAdapter.getColumnDefs()} rowData={gridAdapter.getRowData()} />
<Chart series={chartAdapter.getSeries()} />
```

#### Planned Provider Types (Future)

##### 1. REST Provider

```typescript
interface RestProviderConfig extends ProviderConfig {
  providerType: 'rest';
  baseUrl: string;
  endpoint: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  pollInterval?: number;           // For polling mode (ms)
  paginationMode?: 'offset' | 'cursor' | 'page';
  pageSize?: number;
  auth?: {
    type: 'bearer' | 'apikey' | 'basic';
    credentials: string;
  };
}
```

##### 2. Vanilla WebSocket Provider

```typescript
interface WebSocketProviderConfig extends ProviderConfig {
  providerType: 'websocket';
  url: string;
  protocol?: string;
  messageFormat: 'json' | 'binary' | 'text';
  heartbeatInterval?: number;
  reconnectAttempts?: number;
}
```

##### 3. Socket.IO Provider

```typescript
interface SocketIOProviderConfig extends ProviderConfig {
  providerType: 'socketio';
  url: string;
  namespace?: string;
  events: {
    snapshot: string;
    update: string;
    delete?: string;
  };
  rooms?: string[];
  auth?: any;
}
```

##### 4. GraphQL Provider

```typescript
interface GraphQLProviderConfig extends ProviderConfig {
  providerType: 'graphql';
  endpoint: string;
  query: string;
  subscription?: string;
  variables?: Record<string, any>;
  headers?: Record<string, string>;
}
```

#### Migration Path to Decoupled Architecture

**Phase 1: Interface Cleanup** ⭐ (High Priority)
1. Remove `ColDef` from `IDataProvider` interface
2. Add generic `schema: DataSchema` property
3. Create `schemaToColDefs()` adapter function
4. Update StompProvider to emit generic schema
5. Update DataGridStompShared to use adapter

**Phase 2: Provider Independence**
1. Separate provider configs from grid profiles
2. Create provider management UI
3. Implement provider sharing across components
4. Add provider reference system

**Phase 3: Capability System**
1. Add `capabilities` to `IDataProvider`
2. Make `requestSnapshot()` optional
3. Implement different provider patterns
4. Update UI to adapt based on capabilities

**Phase 4: Multiple Provider Types**
1. Implement REST provider
2. Implement vanilla WebSocket provider
3. Implement Socket.IO provider
4. Create provider type documentation

**Phase 5: Adapter Pattern**
1. Create `IDataAdapter` interface
2. Implement `GridDataAdapter`
3. Implement `ChartDataAdapter`
4. Document adapter creation guide

#### Benefits of Decoupled Architecture

1. **Reusability**: Same provider across multiple components and use cases
2. **Testability**: Providers testable independently from UI
3. **Flexibility**: Support any data source with any UI framework
4. **Maintainability**: Clear separation of data and presentation
5. **Extensibility**: Easy to add new provider types
6. **Performance**: Shared providers reduce connections
7. **Consistency**: Same data source powers multiple views
8. **Portability**: Providers can be used outside of grids (exports, analytics)

---

### 2. Snapshot and Real-time Data Handling

#### Snapshot Phase
- **Request**: Explicit snapshot request sent to STOMP server
- **Batching**: Data received in batches with accumulation
- **End Token Detection**: Case-insensitive token matching ("Success", "END", etc.)
- **Progress Indication**: Busy overlay with message count
- **Completion**: Automatic transition to real-time mode

#### Real-time Updates
- **Transaction-based**: Uses AG-Grid's `applyTransactionAsync` for optimal performance
- **Cell Flashing**: Visual feedback for updated cells
- **Batched Processing**: 50ms batching window to reduce render cycles
- **Key Column Tracking**: Row identification based on provider's key column

#### Snapshot Modes
```typescript
type SnapshotMode = 'idle' | 'requesting' | 'receiving' | 'complete';
```

### 3. Profile Management

#### Profile System
- **Creation**: Save current grid state as new profile
- **Loading**: Load saved profiles with full state restoration
- **Updating**: Update existing profile with current state
- **Deletion**: Remove profiles from storage
- **Default Profile**: Set profile to auto-load on startup
- **Import/Export**: JSON-based profile sharing

#### Profile Data Structure
```typescript
interface DataGridStompSharedProfile extends BaseProfile {
  // Data source
  selectedProviderId: string | null;
  autoConnect: boolean;

  // Grid configuration (legacy - backward compatibility)
  columnState?: any;
  filterModel?: any;
  sortModel?: any;
  groupModel?: any;

  // Full grid state (modern)
  gridState?: GridState;

  // Grid customizations (stored in profile)
  columnGroups?: ColumnGroupDefinition[];
  conditionalFormattingRules?: ConditionalFormattingRule[];
  calculatedColumns?: CalculatedColumnDefinition[];

  // UI preferences
  sidebarVisible: boolean;
  theme: 'light' | 'dark' | 'system';
  showColumnSettings: boolean;
  viewTitle?: string;

  // Performance settings
  asyncTransactionWaitMillis: number;
  rowBuffer: number;

  // Grid options (AG-Grid options)
  gridOptions?: Record<string, any>;
}
```

#### Profile Operations
- **Save Current State**: Captures complete grid state including columns, filters, sorts, groups
- **Unsaved Changes Tracking**: Visual indicator when grid state differs from saved profile
- **Profile Loading Indicator**: Shows "Loading profile..." during state application
- **Profile Versioning**: Each save creates new version via Config Service

### 4. Grid Options Customization

#### Features
- **200+ AG-Grid Options**: Comprehensive configuration interface
- **Categorized View**: Options grouped by function (Display, Editing, Selection, etc.)
- **Alphabetical View**: Flat sorted list for quick searching
- **Search**: Real-time filtering by option name
- **Modified Indicator**: Visual feedback for changed options
- **Reset Options**: Reset to defaults or original values
- **Batch Updates**: Optimized to apply only changed options

#### Grid Options Categories
1. **Display Options**: Visual appearance and layout
2. **Editing Options**: Cell editing behavior
3. **Selection Options**: Row/cell selection modes
4. **Filtering Options**: Filter behavior and UI
5. **Sorting Options**: Sort modes and behavior
6. **Grouping Options**: Row grouping configuration
7. **Pagination Options**: Pagination settings
8. **Performance Options**: Rendering and virtualization
9. **Animation Options**: Animation and transitions

### 5. Column Groups

#### Features
- **Group Creation**: Create hierarchical column groups
- **Group Editing**: Modify existing groups
- **Column Assignment**: Assign columns to groups
- **Open/Close States**: Control column visibility based on group state
  - `open`: Column visible only when group is expanded
  - `closed`: Column visible only when group is collapsed
  - `undefined`: Column always visible
- **Active/Inactive**: Toggle which groups are applied to grid
- **Multiple Groups**: Support for multiple simultaneous groups
- **Persistence**: Groups saved with profile

#### Column Group Definition
```typescript
interface ColumnGroupDefinition {
  id: string;
  groupId: string;
  headerName: string;
  children: string[];           // Column field names
  marryChildren?: boolean;
  openByDefault?: boolean;
  columnStates?: Record<string, 'open' | 'closed' | undefined>;
  createdAt?: number;
  updatedAt?: number;
}
```

#### Column Group Service
- **Apply Groups**: Transforms column definitions with group hierarchy
- **Remove Groups**: Restores flat column structure
- **State Management**: Tracks expanded/collapsed state
- **Validation**: Ensures no duplicate columns across groups

### 6. Conditional Formatting

#### Features
- **Rule-based Formatting**: Apply styles based on expression evaluation
- **Multiple Rules**: Support for multiple rules with priority
- **Cell and Row Targeting**: Apply to specific columns or entire rows
- **Expression Editor**: Monaco-based editor with IntelliSense
- **Keyboard Shortcuts**:
  - Ctrl+Shift+C: Show only columns in IntelliSense
  - Ctrl+Shift+F: Show only functions
  - Ctrl+Shift+V: Show only variables
  - Ctrl+Shift+O: Show only operators
- **Format Options**:
  - Background color
  - Text color
  - Font weight (normal, bold)
  - Font style (normal, italic)
  - Text decoration (underline, line-through)
  - Border color and width
- **Rule Templates**: Pre-built rules for common scenarios
- **Rule Priority**: Control application order
- **Enable/Disable**: Toggle rules on/off

#### Conditional Rule Structure
```typescript
interface ConditionalFormattingRule {
  id: string;
  name: string;
  expression: string;
  enabled: boolean;
  priority: number;
  applyToAllCells: boolean;
  applyToColumns?: string[];
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  borderColor?: string;
  borderWidth?: number;
  createdAt?: number;
  updatedAt?: number;
}
```

#### Expression Syntax
- **Column References**: `[ColumnName]`
- **Operators**: `>`, `<`, `>=`, `<=`, `==`, `!=`, `&&`, `||`
- **Functions**: `ABS()`, `ROUND()`, `UPPER()`, `LOWER()`, etc.
- **Literals**: Numbers, strings in quotes

### 7. Calculated Columns

#### Features
- **Formula-based Columns**: Create columns from expressions
- **Expression Editor**: Monaco editor with syntax highlighting
- **Column Configuration**:
  - Field name
  - Header name
  - Data type (number, text, boolean, date)
  - Width
  - Pinning (left, right)
  - Description
- **Preview Tab**: See calculated results
- **Settings Tab**: Configure column properties
- **Active/Inactive**: Control which columns are added to grid
- **Persistence**: Saved with profile

#### Calculated Column Definition
```typescript
interface CalculatedColumnDefinition {
  id: string;
  field: string;
  headerName: string;
  expression: string;
  cellDataType?: 'text' | 'number' | 'boolean' | 'date';
  pinned?: 'left' | 'right';
  width?: number;
  valueFormatter?: string;
  createdAt?: number;
  updatedAt?: number;
  description?: string;
}
```

### 8. Theme Management

#### Features
- **Light/Dark Mode**: Toggle between themes
- **System Theme**: Automatic theme based on OS settings
- **Synchronized Styling**: All UI elements update together
- **AG-Grid Theme**: Custom AG-Grid Quartz theme with dual color schemes
- **Persistent**: Theme preference saved in profile

#### Theme Configuration
```typescript
// Light theme
{
  accentColor: "#8AAAA7",
  backgroundColor: "#E6E6E6",
  cellTextColor: "#000000",
  headerBackgroundColor: "#D9D9D9D6",
  oddRowBackgroundColor: "#DCDCDCE8",
  ...
}

// Dark theme
{
  accentColor: "#8AAAA7",
  backgroundColor: "#171717",
  foregroundColor: "#FFF",
  oddRowBackgroundColor: "#1f1f1f",
  ...
}
```

### 9. View Title Management

#### Features
- **Custom Titles**: Set custom window titles
- **Rename Dialog**: Dialog for changing view name
- **Persistence**: Title saved in profile (previously localStorage)
- **Context Menu Integration**: Right-click "Rename View" option
- **Automatic Restore**: Title restored on load

### 10. Grid State Management

#### Comprehensive State Capture
The `GridStateManager` captures:
- Column state (width, position, visibility, pinning)
- Filter model (active filters and conditions)
- Sort model (sort columns and directions)
- Group model (row grouping configuration)
- Expansion state (expanded row groups)
- Selection state (selected rows)
- Pagination state (page, page size)
- Sidebar state (visibility and tool panels)
- Grid options (AG-Grid configuration)
- Custom state (column groups, formatting rules)

#### State Extraction
```typescript
interface GridState {
  columnState: ColumnState[];
  filterModel: FilterModel;
  sortModel: SortModelItem[];
  groupModel?: any;
  expansionState: string[];
  selectedRows: string[];
  paginationPageSize?: number;
  paginationCurrentPage?: number;
  sideBarState?: any;
  gridOptions?: Record<string, any>;
  columnDefs?: ColDef[];
  activeColumnGroupIds?: string[];
  customState?: Record<string, any>;
  version: string;
  timestamp: number;
}
```

---

## UI Features

### Layout Structure

#### Overall Layout
```
┌─────────────────────────────────────────────────────────────┐
│                         Toolbar                              │
│  [Profile] [Connection] [Status] [Settings] [Theme]         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                     AG-Grid Container                         │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Column Headers                                        │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                         │  │
│  │               Grid Rows (virtualized)                  │  │
│  │                                                         │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Status Bar                                            │  │
│  │  [Row Count] [Filtered] [Selected] [Connection]       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Toolbar Layout (56px height)
```
┌─────────────────────────────────────────────────────────────┐
│ Profile:  [Select▾] [Save] [Save As] [Manage]  │  Provider: │
│ [Select▾] [Connect] │ [Sidebar] [Theme] [Settings▾]        │
└─────────────────────────────────────────────────────────────┘
```

### Toolbar Components

#### 1. Profile Section
- **Profile Dropdown**: Select active profile
  - Shows profile name
  - Badge indicates active profile
  - Loading indicator during profile load
- **Save Button**: Update current profile
  - Disabled when no changes
  - Shows saving indicator
- **Save As Button**: Create new profile from current state
- **Manage Button**: Open profile management dialog
  - Visual indicator for unsaved changes (orange badge)

#### 2. Connection Section
- **Provider Dropdown**: Select data source provider
  - Lists available providers
  - Shows current selection
- **Connect/Disconnect Button**: Toggle connection
  - Green "Connected" when active
  - Gray "Connect" when idle
  - Disabled during connection attempt

#### 3. Status Section
- **Profile Status Indicator**: Shows profile operation status
  - Loading: Blue spinner with "Loading profile..."
  - Saving: Blue spinner with "Saving profile..."
  - Error: Red alert with error message

#### 4. Settings Section (Dropdown Menu)
- **Grid Options**: Open grid options editor
- **Column Groups**: Open column groups editor
- **Conditional Formatting**: Open formatting rules editor
- **Calculated Columns**: Open calculated columns editor
- **Expression Editor**: Open standalone expression editor
- **Rename View**: Change window title

#### 5. Theme Toggle
- **Sun Icon**: Switch to light mode (in dark mode)
- **Moon Icon**: Switch to dark mode (in light mode)
- Instant theme switching with smooth transitions

#### 6. Sidebar Toggle
- **Panel Icon**: Toggle AG-Grid sidebar
- Sidebar contains:
  - Columns tool panel (show/hide columns)
  - Filters tool panel (advanced filtering)

### Busy Indicator

#### Snapshot Loading Overlay
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                      ╭──────────────────╮                   │
│                      │   ⟳ Loading...   │                   │
│                      │                  │                   │
│                      │ Waiting for      │                   │
│                      │ snapshot...      │                   │
│                      ╰──────────────────╯                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

Features:
- **Semi-transparent backdrop**: 80% opacity background blur
- **Centered modal**: Loading spinner and message
- **Progress indicator**: Shows row count during snapshot
- **Two states**:
  - "Waiting for snapshot..." (requesting)
  - "Receiving snapshot data... X rows received" (receiving)

### Status Bar

#### Components (bottom of grid)
- **Total and Filtered Row Count**: "X of Y rows"
- **Total Row Count**: "Total: X"
- **Filtered Row Count**: "Filtered: X"
- **Selected Row Count**: "X selected"
- **Aggregation**: Shows column aggregations (sum, avg, etc.)
- **Connection Status**: Custom panel showing:
  - Green dot + "Connected" (when connected)
  - Gray dot + "Disconnected" (when not connected)

### Color Scheme

#### Light Mode
- **Background**: `#E6E6E6` (light gray)
- **Card Background**: White with subtle shadow
- **Text**: `#000000` (black)
- **Primary Accent**: `#8AAAA7` (teal)
- **Border**: `#23202029` (light gray with transparency)
- **Odd Rows**: `#DCDCDCE8` (slightly darker gray)
- **Header**: `#D9D9D9D6` (medium gray)

#### Dark Mode
- **Background**: `#171717` (near black)
- **Card Background**: `#1f1f1f` (dark gray)
- **Text**: `#FFFFFF` (white)
- **Primary Accent**: `#8AAAA7` (teal)
- **Odd Rows**: `#1f1f1f` (dark gray)
- **Header**: Slightly lighter than background

#### Accent Colors
- **Success**: Green (`#22c55e`)
- **Warning**: Yellow (`#eab308`)
- **Error**: Red (`#ef4444`)
- **Info**: Blue (`#3b82f6`)

### Typography

#### Font Family
- **Primary**: Inter (Google Font)
- **Monospace**: For code and expressions

#### Font Sizes
- **Headers**: 14px (medium weight)
- **Body**: 14px (regular weight)
- **Small**: 12px (labels, captions)
- **Tiny**: 11px (helper text)
- **Icons**: 12px

#### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

### Spacing

#### Padding Scale
- **Minimal**: 4px (0.25rem)
- **Small**: 8px (0.5rem)
- **Medium**: 12px (0.75rem)
- **Default**: 16px (1rem)
- **Large**: 24px (1.5rem)

#### Grid Spacing
- **Cell Spacing**: 6px
- **Row Height**: Auto (based on content)
- **Header Height**: Auto
- **Border Width**: 1px

### Borders and Shadows

#### Borders
- **Default Border**: 1px solid with theme-based color
- **Radius**: 2px (buttons, inputs, cards)
- **Column Borders**: Enabled by default

#### Shadows
- **Card Shadow**: `0 1px 3px rgba(0,0,0,0.1)`
- **Dialog Shadow**: `0 10px 40px rgba(0,0,0,0.2)`
- **Hover Shadow**: `0 2px 8px rgba(0,0,0,0.15)`

### Visual Feedback

#### Hover States
- **Buttons**: Slight background color change
- **Rows**: Subtle background highlight
- **Menu Items**: Background change to accent color

#### Active States
- **Selected Rows**: Primary accent background with low opacity
- **Active Profile**: Badge indicator
- **Connected State**: Green color

#### Loading States
- **Spinner**: Rotating icon
- **Progress**: Text indicator with count
- **Disabled**: 50% opacity

#### Cell Flash
- **Duration**: 500ms
- **Fade Duration**: 1000ms
- **Color**: Yellow background fade

---

## Dependencies

### NPM Packages

#### Core Dependencies
```json
{
  "ag-grid-community": "^33.x",
  "ag-grid-react": "^33.x",
  "ag-grid-enterprise": "^33.x",
  "react": "^18.x",
  "react-dom": "^18.x",
  "typescript": "^5.x"
}
```

#### UI Libraries
```json
{
  "@radix-ui/react-dialog": "Dialog components",
  "@radix-ui/react-dropdown-menu": "Dropdown menus",
  "@radix-ui/react-select": "Select inputs",
  "@radix-ui/react-switch": "Toggle switches",
  "@radix-ui/react-tabs": "Tab navigation",
  "@radix-ui/react-tooltip": "Tooltips",
  "@radix-ui/react-scroll-area": "Custom scrollbars",
  "@radix-ui/react-separator": "Visual separators",
  "lucide-react": "Icon library"
}
```

#### Utilities
```json
{
  "class-variance-authority": "Conditional className utility",
  "clsx": "ClassName composition",
  "tailwind-merge": "Tailwind class merging"
}
```

#### Expression Editor
```json
{
  "@monaco-editor/react": "Code editor for expressions",
  "monaco-editor": "Monaco editor core"
}
```

#### OpenFin
```json
{
  "@openfin/core": "OpenFin API",
  "@openfin/workspace": "OpenFin Workspace features"
}
```

### Custom Hooks

#### Connection and Data
- **useSharedWorkerConnection**: Manages SharedWorker connection lifecycle
- **useSnapshotData**: Handles snapshot and real-time data
- **useProviderConfig**: Loads provider configuration from Config Service

#### Grid State
- **useGridState**: Manages AG-Grid API and state operations
- **useGridOptionsManagement**: Handles grid options customization
- **useColumnGroupManagement**: Manages column group operations

#### Profiles
- **useProfileManagement**: Core profile CRUD operations (from shared hooks)
- **useProfileOperations**: Profile-specific operations (save, export, import)
- **useProfileApplication**: Applies profile state to grid

#### UI
- **useViewTitle**: Manages window title
- **useThemeSync**: Synchronizes theme across components
- **useDialogManagement**: Manages dialog visibility and data
- **useIABManagement**: Inter-application bus communication

#### Other
- **useConnectionManagement**: Connection lifecycle management
- **useToast**: Toast notifications (from shadcn/ui)

### Custom Utilities

#### Grid State Manager
```typescript
// src/windows/datagrid/components/DataGridStompShared/utils/gridStateManager.ts
class GridStateManager {
  extractState(options): GridState;
  applyState(state, options): void;
  setActiveColumnGroupIds(ids: string[]): void;
  getActiveColumnGroupIds(): string[];
  getPendingColumnState(): any;
  clearPendingColumnState(): void;
  resetToDefault(): void;
}
```

#### Column Group Service
```typescript
// src/windows/datagrid/components/DataGridStompShared/columnGroups/columnGroupService.ts
class ColumnGroupService {
  static applyColumnGroups(columnDefs, groups, activeGroupIds): ColDef[];
  static removeColumnGroups(columnDefs): ColDef[];
  static migrateProfileColumnGroups(gridId, groups): string[];
  static saveColumnGroupState(gridId, gridApi, groups): void;
}
```

#### Storage Classes
```typescript
// Grid-level storage for column groups
class GridColumnGroupStorage {
  static initialize(profileMgmt, profile): void;
  static saveGroup(gridId, group): void;
  static getGroup(gridId, groupId): ColumnGroupDefinition;
  static getAllGroups(gridId): ColumnGroupDefinition[];
  static deleteGroup(gridId, groupId): void;
}

// Grid-level storage for conditional formatting
class GridConditionalFormattingStorage {
  static initialize(profileMgmt, profile): void;
  static saveRule(gridId, rule): void;
  static getRule(gridId, ruleId): ConditionalFormattingRule;
  static getRules(gridId, ruleIds): ConditionalFormattingRule[];
  static deleteRule(gridId, ruleId): void;
}

// Grid-level storage for calculated columns
class GridCalculatedColumnsStorage {
  static initialize(profileMgmt, profile): void;
  static saveColumn(gridId, column): void;
  static getColumn(gridId, columnId): CalculatedColumnDefinition;
  static getColumns(gridId, columnIds): CalculatedColumnDefinition[];
  static deleteColumn(gridId, columnId): void;
}
```

### AG-Grid Components

#### Custom Cell Renderers
```typescript
// Registered in agGridComponents
{
  booleanRenderer: BooleanRenderer,
  dateRenderer: DateRenderer,
  statusRenderer: StatusRenderer,
  // ... other custom renderers
}
```

#### Custom Value Formatters
```typescript
// Registered in agGridValueFormatters
{
  currencyFormatter: (params) => formatCurrency(params.value),
  percentageFormatter: (params) => formatPercentage(params.value),
  dateFormatter: (params) => formatDate(params.value),
  // ... other formatters
}
```

#### Status Panels
```typescript
// Custom status panel
class ConnectionStatusPanel implements IStatusPanelComp {
  init(params): void;
  getGui(): HTMLElement;
  refresh(): void;
}
```

### Services

#### Window Manager
```typescript
// src/services/window/windowManager.ts
class WindowManager {
  static registerViewInstance(id, name, type): void;
  static unregisterViewInstance(id): void;
  static getViewInstance(id): ViewInstance;
  static getAllViewInstances(): ViewInstance[];
}
```

#### OpenFin Dialog Service
```typescript
// src/services/openfin/OpenFinDialogService.ts
class OpenFinDialogService {
  openDialog(options: DialogOptions): Promise<void>;
  closeDialog(name: string): Promise<void>;
  sendDataToDialog(name: string, data: any): void;
}
```

#### SharedWorker Client
```typescript
// src/services/sharedWorker/SharedWorkerClient.ts
class SharedWorkerClient extends EventEmitter {
  connect(): Promise<void>;
  subscribe(providerId, config): Promise<void>;
  unsubscribe(providerId): Promise<void>;
  requestSnapshot(providerId): Promise<void>;
  getStatus(providerId): Promise<any>;
  destroy(): void;
}
```

---

## Dialog Boxes

### 1. Profile Management Dialog

#### Purpose
Manage saved profiles: load, rename, delete, set default, import, export

#### Layout
```
┌──────────────────────────────────────────┐
│  Profile Management                  [X] │
├──────────────────────────────────────────┤
│  ┌────────────────────────────────────┐ │
│  │ Profile List                        │ │
│  │ ┌──────────────────────────────┐   │ │
│  │ │ ● Profile 1 (Default)        │   │ │
│  │ │   Profile 2                  │   │ │
│  │ │   Profile 3                  │   │ │
│  │ └──────────────────────────────┘   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [Rename] [Delete] [Set Default]        │
│  [Import] [Export]                       │
│                                          │
│              [Close]                     │
└──────────────────────────────────────────┘
```

#### Features
- **Profile List**: Shows all saved profiles with active indicator
- **Rename**: Change profile name
- **Delete**: Remove profile with confirmation
- **Set Default**: Mark profile for auto-load
- **Import**: Load profile from JSON file
- **Export**: Save profile to JSON file

#### Styling
- **Size**: 600x500px
- **Modal**: Yes
- **Resizable**: Yes
- **Draggable**: Yes

### 2. Save Profile Dialog

#### Purpose
Create new profile from current grid state

#### Layout
```
┌──────────────────────────────────────────┐
│  Create New Profile              [X]     │
├──────────────────────────────────────────┤
│                                          │
│  Profile Name:                           │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                          │
│           [Cancel]  [Save]               │
└──────────────────────────────────────────┘
```

#### Features
- **Name Input**: Text field for profile name
- **Validation**: Ensures name is not empty
- **Cancel**: Close without saving
- **Save**: Create profile and close

#### Styling
- **Size**: 400x200px
- **Modal**: Yes
- **Centered**: Yes

### 3. Rename View Dialog

#### Purpose
Change the window/view title

#### Layout
```
┌──────────────────────────────────────────┐
│  Rename View                     [X]     │
├──────────────────────────────────────────┤
│                                          │
│  Current: DataGrid STOMP (Shared)        │
│                                          │
│  New Name:                               │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                          │
│           [Cancel]  [Rename]             │
└──────────────────────────────────────────┘
```

#### Features
- **Current Title**: Shows existing title
- **Name Input**: Text field for new title
- **Cancel**: Close without changing
- **Rename**: Update title and close

#### Styling
- **Size**: 400x220px
- **Modal**: Yes
- **Centered**: Yes

### 4. Grid Options Editor

#### Purpose
Configure 200+ AG-Grid display and behavior options

#### Layout
```
┌────────────────────────────────────────────────────────┐
│  Grid Options                                    [X]   │
├────────────────────────────────────────────────────────┤
│  Configure AG-Grid display and behavior options.      │
│  Changes will be saved to your current profile.       │
├────────────────────────────────────────────────────────┤
│  [⚏/↕] [Search properties...                    ] [X] │
├────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐ │
│  │ DISPLAY OPTIONS                            [v]   │ │
│  │   rowHeight              100                      │ │
│  │   headerHeight           auto                     │ │
│  │   animateRows            ☐                        │ │
│  │                                                    │ │
│  │ EDITING OPTIONS                            [v]   │ │
│  │   singleClickEdit        ☐                        │ │
│  │   stopEditingWhenCells   ☐                        │ │
│  │                                                    │ │
│  │ SELECTION OPTIONS                          [v]   │ │
│  │   rowSelection           single          [v]     │ │
│  │   suppressRowClickSelect ☐                        │ │
│  │                                                    │ │
│  │ ... more options ...                              │ │
│  └──────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│  [Profile Name] [Modified]                            │
│              [Defaults] [Reset] [Cancel] [Apply]     │
└────────────────────────────────────────────────────────┘
```

#### Features
- **View Modes**:
  - Categorized: Options grouped by function
  - Alphabetical: Flat sorted list
- **Search**: Real-time filtering
- **Property Grid**:
  - Boolean: Checkbox
  - Number: Number input
  - String: Text input
  - Enum: Dropdown select
- **Modified Indicator**: Changed options shown in primary color
- **Defaults Button**: Reset all to AG-Grid defaults
- **Reset Button**: Revert to saved profile values
- **Apply Button**: Save changes to profile

#### Styling
- **Size**: 900x700px
- **Scrollable**: Yes
- **Property Grid Style**: Microsoft-style property grid
- **Font**: 12px for properties, 11px for categories
- **Colors**: Theme-aware with primary accent for modified values

### 5. Column Groups Editor

#### Purpose
Create and manage hierarchical column groups

#### Layout
```
┌────────────────────────────────────────────────────────────────┐
│  Column Groups                                           [X]   │
├────────────────────────────────────────────────────────────────┤
│  Create and manage column groups for your grid.               │
├────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┬──────────────────────────────────┐   │
│  │ Column Groups       │  Group Name:                      │   │
│  │                     │  ┌──────────────────────────────┐│   │
│  │ 2 of 5 active       │  │                              ││   │
│  │ [Clear All]         │  └──────────────────────────────┘│   │
│  │                     │                                   │   │
│  │ ┌─────────────────┐│  Available Columns                │   │
│  │ │☑ Trading Group  ││  ┌──────────────────────────────┐│   │
│  │ │  3 columns      ││  │☐ Symbol      [Open    ▾]    ││   │
│  │ │                 ││  │☐ Price       [Closed  ▾]    ││   │
│  │ │☑ Market Group   ││  │☐ Volume      [Default ▾]    ││   │
│  │ │  5 columns      ││  │☐ Change      [Open    ▾]    ││   │
│  │ │                 ││  │☐ ...                         ││   │
│  │ │☐ Risk Group     ││  └──────────────────────────────┘│   │
│  │ │  2 columns      ││                                   │   │
│  │ │  (not applied)  ││        [Cancel Edit] [Update]    │   │
│  │ └─────────────────┘│  or    [Create Group]             │   │
│  └─────────────────────┴──────────────────────────────────┘   │
│                                                                │
│                            [Cancel]  [Apply Changes]          │
└────────────────────────────────────────────────────────────────┘
```

#### Features
- **Two-Panel Layout**:
  - Left: List of created groups
  - Right: Column selection and group configuration
- **Group List**:
  - Checkbox to activate/deactivate group
  - Group name and column count
  - Click to edit
  - Delete button
- **Column Selection**:
  - Checkbox to add column to group
  - Dropdown to set visibility state (Open/Closed/Default)
  - Only shows unassigned columns
- **Group Operations**:
  - Create new group
  - Edit existing group
  - Delete group
  - Clear all groups
- **Active Group Management**:
  - Only checked groups are applied to grid
  - Unchecked groups saved but not applied

#### Styling
- **Size**: 1000x700px
- **Left Panel**: 40% width, 260px min
- **Right Panel**: 60% width
- **Colors**: Checkboxes use primary accent when checked
- **Selected Group**: Primary background with border

### 6. Conditional Formatting Editor

#### Purpose
Create and manage conditional formatting rules with visual styling

#### Layout
```
┌────────────────────────────────────────────────────────────────────┐
│  Conditional Formatting                                      [X]   │
├────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┬──────────────────────────────────────┐   │
│  │ Rules               │  Rule Editor                          │   │
│  │                     │                                       │   │
│  │ [Add] [Templates]   │  Name: [High Value Rule          ]   │   │
│  │                     │                                       │   │
│  │ ┌─────────────────┐│  Expression:                          │   │
│  │ │☑ High Values    ││  ┌──────────────────────────────────┐│   │
│  │ │                 ││  │ [Price] > 100                    ││   │
│  │ │☑ Negative       ││  │                                  ││   │
│  │ │                 ││  │ // IntelliSense available        ││   │
│  │ │☐ Weekend        ││  │ // Ctrl+Shift+C for columns      ││   │
│  │ │  (disabled)     ││  │ // Ctrl+Shift+F for functions    ││   │
│  │ └─────────────────┘││  └──────────────────────────────────┘│   │
│  │                     │                                       │   │
│  │                     │  Apply To:                            │   │
│  │                     │  ⊙ All Cells  ○ Selected Columns     │   │
│  │                     │                                       │   │
│  │                     │  ┌─ Formatting ──────────────────┐  │   │
│  │                     │  │ Background: [🎨 #ffff00]       │  │   │
│  │                     │  │ Text Color: [🎨 #000000]       │  │   │
│  │                     │  │ Font Weight: [Bold      ▾]     │  │   │
│  │                     │  │ Font Style:  [Italic    ▾]     │  │   │
│  │                     │  │ Border:      [1px solid #ccc]  │  │   │
│  │                     │  └────────────────────────────────┘  │   │
│  └─────────────────────┴──────────────────────────────────────┘   │
│                                                                    │
│  3 of 5 rules active         [Close] [Save Rules] [Apply]        │
└────────────────────────────────────────────────────────────────────┘
```

#### Features
- **Three-Panel Layout**:
  - Left: Rules list with checkboxes
  - Center: Expression editor
  - Right: Formatting options
- **Rules List**:
  - Checkbox to enable/disable rule
  - Rule name
  - Visual indicator (enabled/disabled)
  - Priority number
  - Drag to reorder (if implemented)
- **Expression Editor**:
  - Monaco editor with syntax highlighting
  - IntelliSense for columns, functions, operators
  - Keyboard shortcuts
  - Responsive width adaptation
- **Formatting Options**:
  - Color pickers for background and text
  - Dropdowns for font properties
  - Border style editor
  - Preview of applied formatting
- **Rule Operations**:
  - Add new rule
  - Duplicate rule
  - Delete rule
  - Move up/down (priority)
  - Toggle enabled
- **Templates**:
  - Pre-built rules for common scenarios
  - One-click application

#### Styling
- **Size**: 1200x800px
- **Sidebar**: 260px width, 220px min
- **Professional Design**: Clean, minimal, sophisticated
- **Resizable Panels**: Using Flexbox (not ResizablePanels)
- **Colors**: Theme-aware with subtle accents
- **Typography**: Consistent 12px base with hierarchical sizes
- **Custom CSS**: `conditionalFormatting.css` with comprehensive styling

### 7. Calculated Columns Editor

#### Purpose
Create formula-based calculated columns

#### Layout
```
┌────────────────────────────────────────────────────────────────────┐
│  Calculated Columns                                          [X]   │
├────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┬──────────────────────────────────────┐   │
│  │ Columns             │  Column Editor                        │   │
│  │                     │                                       │   │
│  │ [Add Column]        │  Field Name: [calculated_1         ] │   │
│  │                     │  Header:     [Calculated Column 1  ] │   │
│  │ ┌─────────────────┐│                                       │   │
│  │ │☑ Profit Margin  ││  [Expression] [Settings] [Preview]   │   │
│  │ │  calculated_1   ││                                       │   │
│  │ │                 ││  ┌──────────────────────────────────┐│   │
│  │ │☑ Total Value    ││  │ ([Price] * [Quantity])           ││   │
│  │ │  calculated_2   ││  │                                  ││   │
│  │ │                 ││  │ // Use [ColumnName] syntax       ││   │
│  │ │☐ Risk Score     ││  │ // IntelliSense available        ││   │
│  │ │  calculated_3   ││  │                                  ││   │
│  │ │  (not applied)  ││  └──────────────────────────────────┘│   │
│  │ └─────────────────┘││                                       │   │
│  │                     │  Settings:                            │   │
│  │                     │  Data Type:  [Number      ▾]         │   │
│  │                     │  Width:      [120              ]     │   │
│  │                     │  Pinned:     [None        ▾]         │   │
│  │                     │  Description:                         │   │
│  │                     │  ┌──────────────────────────────────┐│   │
│  │                     │  │                                  ││   │
│  │                     │  └──────────────────────────────────┘│   │
│  └─────────────────────┴──────────────────────────────────────┘   │
│                                                                    │
│                         [Close] [Save Columns] [Apply]            │
└────────────────────────────────────────────────────────────────────┘
```

#### Features
- **Two-Panel Layout**:
  - Left: List of calculated columns
  - Right: Column editor with tabs
- **Column List**:
  - Checkbox to activate/deactivate
  - Column name and field
  - Click to edit
  - Delete button
- **Editor Tabs**:
  - **Expression**: Monaco editor for formula
  - **Settings**: Column configuration
  - **Preview**: See calculated results (placeholder)
- **Settings Panel**:
  - Data type selection
  - Width specification
  - Pinning options
  - Description field
- **Column Operations**:
  - Add new column
  - Edit existing
  - Delete column
  - Toggle active state

#### Styling
- **Size**: 1200x800px
- **Sidebar**: 350px width
- **Tab Navigation**: At top of editor panel
- **Colors**: Theme-aware with primary accents
- **Custom CSS**: `calculatedColumns.css`

### 8. Expression Editor (Standalone)

#### Purpose
Standalone expression editor for testing and development

#### Layout
```
┌────────────────────────────────────────────────────────────────────┐
│  Expression Editor                                           [X]   │
├────────────────────────────────────────────────────────────────────┤
│  Mode: ⊙ Conditional  ○ Calculation                               │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ [Price] > 100 && [Volume] > 1000                             │ │
│  │                                                               │ │
│  │ // IntelliSense: Ctrl+Space                                  │ │
│  │ // Columns:     Ctrl+Shift+C                                 │ │
│  │ // Functions:   Ctrl+Shift+F                                 │ │
│  │                                                               │ │
│  └──────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────┤
│  Available Columns: Symbol, Price, Volume, Change, ...            │
├────────────────────────────────────────────────────────────────────┤
│                                   [Cancel]  [Save]                │
└────────────────────────────────────────────────────────────────────┘
```

#### Features
- **Mode Selection**: Conditional or Calculation
- **Monaco Editor**: Full-featured code editor
- **IntelliSense**: Context-aware completions
- **Keyboard Shortcuts**: Quick access to completions
- **Column List**: Shows available columns
- **Validation**: Real-time syntax checking

#### Styling
- **Size**: 800x600px
- **Modal**: Yes
- **Draggable**: Yes

---

## Hooks

### useSharedWorkerConnection

#### Purpose
Manages SharedWorker connection lifecycle and STOMP provider subscription

#### API
```typescript
interface UseSharedWorkerConnectionResult {
  connectionState: ConnectionState;
  workerClient: SharedWorkerClient | null;
  connect: (config: ProviderConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  subscribe: (providerId: string, config: ProviderConfig) => Promise<void>;
  unsubscribe: (providerId: string) => Promise<void>;
}

function useSharedWorkerConnection(
  selectedProviderId: string | null,
  gridApiRef?: React.MutableRefObject<any>
): UseSharedWorkerConnectionResult
```

#### Responsibilities
- Initialize SharedWorker client on mount
- Set up event listeners for connected, disconnected, error events
- Maintain connection state (isConnected, isConnecting, etc.)
- Update AG-Grid context with connection status
- Handle connection/disconnection alerts and toasts
- Cleanup on unmount

#### Internal State
- `isConnected` (state): UI reactive
- `currentClientId` (state): UI reactive
- `sharedWorkerClientRef` (ref): SharedWorker instance
- `isConnectingRef` (ref): Prevents duplicate connections
- `wasManuallyDisconnectedRef` (ref): Prevents auto-reconnect
- `hasShownDisconnectAlertRef` (ref): Prevents duplicate alerts

### useSnapshotData

#### Purpose
Manages snapshot data loading and real-time updates

#### API
```typescript
interface SnapshotData {
  mode: SnapshotMode;
  data: RowData[];
  messageCount: number;
  isComplete: boolean;
}

interface UseSnapshotDataResult {
  snapshotData: SnapshotData;
  handleSnapshotData: (data: any[]) => void;
  handleRealtimeUpdate: (data: any[]) => void;
  resetSnapshot: () => void;
  requestSnapshot: (client: SharedWorkerClient, providerId: string) => Promise<void>;
}

function useSnapshotData(
  gridApiRef: React.MutableRefObject<GridApi | null>
): UseSnapshotDataResult
```

#### Responsibilities
- Track snapshot mode (idle, requesting, receiving, complete)
- Accumulate snapshot data from batches
- Apply real-time updates via AG-Grid transactions
- Handle snapshot completion
- Request snapshot from provider
- Reset snapshot state

#### Snapshot Flow
1. **Idle**: No snapshot requested
2. **Requesting**: Snapshot request sent, waiting for data
3. **Receiving**: Batches arriving, accumulating data
4. **Complete**: End token received, all data loaded

### useProviderConfig

#### Purpose
Load provider configuration from Config Service

#### API
```typescript
interface UseProviderConfigResult {
  providerConfig: ProviderConfig | null;
  columnDefs: ColDef[] | null;
  isLoading: boolean;
  error: Error | null;
}

function useProviderConfig(
  selectedProviderId: string | null
): UseProviderConfigResult
```

#### Responsibilities
- Fetch provider configuration when provider ID changes
- Extract column definitions from configuration
- Handle loading and error states
- Cache loaded configurations

### useGridState

#### Purpose
Manages AG-Grid API references and state operations

#### API
```typescript
interface UseGridStateResult {
  gridApi: GridApi<RowData> | null;
  columnApi: any | null;
  gridApiRef: React.MutableRefObject<GridApi<RowData> | null>;
  onGridReady: (params: GridReadyEvent<RowData>) => void;
  getRowId: (params: any) => string;
  applyProfileGridState: (profile: DataGridStompSharedProfile | null) => void;
  extractGridState: () => Partial<GridState>;
  extractFullGridState: () => GridState | null;
  resetGridState: () => void;
  setColumnGroups: (groupIds: string[]) => void;
  getColumnGroups: () => string[];
  getPendingColumnState: () => any;
  clearPendingColumnState: () => void;
  gridStateManagerRef: React.MutableRefObject<GridStateManager>;
}

function useGridState(
  providerConfig: any,
  activeProfileData: DataGridStompSharedProfile | null,
  profileStatusCallbacks?: ProfileStatusCallbacks,
  isSavingProfileRef?: React.MutableRefObject<boolean>
): UseGridStateResult
```

#### Responsibilities
- Store GridApi and ColumnApi references
- Handle onGridReady event
- Generate row IDs based on key column
- Apply profile grid state to grid
- Extract current grid state for saving
- Manage column group IDs
- Interface with GridStateManager

### useGridOptionsManagement

#### Purpose
Manage grid options customization and application

#### API
```typescript
interface UseGridOptionsManagementResult {
  unsavedGridOptions: Record<string, any> | null;
  handleApplyGridOptions: (options: Record<string, any>) => void;
  getCurrentGridOptions: () => Record<string, any>;
  clearUnsavedOptions: () => void;
  gridTheme: any;
}

function useGridOptionsManagement({
  gridApi,
  activeProfileData
}: {
  gridApi: GridApi | null;
  activeProfileData: DataGridStompSharedProfile | null;
}): UseGridOptionsManagementResult
```

#### Responsibilities
- Track unsaved grid options
- Apply options to grid via `setGridOption` API
- Get current grid options
- Clear unsaved changes
- Generate grid theme based on options

### useColumnGroupManagement

#### Purpose
Manage column group operations

#### API
```typescript
interface UseColumnGroupManagementResult {
  handleApplyColumnGroups: (activeGroupIds: string[], allGroups: ColumnGroupDefinition[]) => void;
}

function useColumnGroupManagement({
  gridApi,
  columnApi,
  columnDefs,
  activeProfileData,
  unsavedColumnGroups,
  setUnsavedColumnGroups,
  getColumnGroups,
  setColumnGroups,
  getPendingColumnState,
  clearPendingColumnState,
  isProfileLoadingRef,
  checkProfileApplicationComplete,
  setColumnGroupsApplied,
  isSavingProfileRef,
  gridInstanceId
}: ColumnGroupManagementProps): UseColumnGroupManagementResult
```

#### Responsibilities
- Apply column groups to grid
- Transform column definitions with groups
- Save groups to grid-level storage
- Handle pending column state
- Coordinate with profile saving

### useProfileOperations

#### Purpose
Handle profile-related operations

#### API
```typescript
interface UseProfileOperationsResult {
  profileLoadingState: ProfileLoadingState;
  isProfileLoadingRef: React.MutableRefObject<boolean>;
  handleProfileLoad: (versionId: string) => Promise<void>;
  saveCurrentState: (...args) => Promise<boolean>;
  handleProfileExport: () => Promise<void>;
  handleProfileImport: (file: File) => Promise<void>;
  handleProfileRename: (versionId: string, newName: string) => Promise<void>;
  handleSetDefault: (versionId: string) => Promise<void>;
}

function useProfileOperations(props: ProfileOperationsProps): UseProfileOperationsResult
```

#### Responsibilities
- Load profile with loading indicator
- Save current state to profile
- Export profile to JSON
- Import profile from JSON
- Rename profile
- Set default profile
- Migrate old column group format

### useConnectionManagement

#### Purpose
Manage connection lifecycle and event handling

#### API
```typescript
interface UseConnectionManagementResult {
  connectToSharedWorker: () => Promise<void>;
  disconnectFromSharedWorker: () => Promise<void>;
  handleProviderChange: (providerId: string | null) => string | null;
}

function useConnectionManagement(props: ConnectionManagementProps): UseConnectionManagementResult
```

#### Responsibilities
- Connect to SharedWorker
- Disconnect from SharedWorker
- Auto-connect based on profile setting
- Handle snapshot and update events
- Monitor connection status changes
- Provider change coordination

### useDialogManagement

#### Purpose
Manage dialog visibility and communication

#### API
```typescript
interface UseDialogManagementResult {
  showProfileDialog: boolean;
  setShowProfileDialog: (show: boolean) => void;
  showSaveDialog: boolean;
  setShowSaveDialog: (show: boolean) => void;
  showRenameDialog: boolean;
  setShowRenameDialog: (show: boolean) => void;
  showExpressionEditor: boolean;
  setShowExpressionEditor: (show: boolean) => void;
  handleOpenGridOptions: () => Promise<void>;
  handleOpenColumnGroups: () => Promise<void>;
  handleOpenConditionalFormatting: () => Promise<void>;
  handleOpenCalculatedColumns: () => Promise<void>;
  handleOpenRenameDialog: () => Promise<void>;
  handleOpenExpressionEditor: () => void;
  handleOpenSaveDialog: () => void;
  handleOpenProfileDialog: () => void;
  handleExpressionSave: (expression: string, mode: string) => void;
}

function useDialogManagement(props: DialogManagementProps): UseDialogManagementResult
```

#### Responsibilities
- Manage dialog visibility state
- Open dialogs with OpenFinDialogService
- Pass data to dialogs
- Handle dialog callbacks
- Coordinate with profile data

### useViewTitle

#### Purpose
Manage window title persistence

#### API
```typescript
interface UseViewTitleResult {
  currentViewTitle: string;
  saveViewTitle: (title: string) => void;
}

function useViewTitle({
  viewInstanceId,
  profileManagement,
  activeProfileData
}: {
  viewInstanceId: string;
  profileManagement: { updateProfilePartial: (updates: any) => void };
  activeProfileData: DataGridStompSharedProfile;
}): UseViewTitleResult
```

#### Responsibilities
- Load view title from profile
- Save view title to profile (via profileManagement)
- Update window title
- Fallback to localStorage for backward compatibility

### useThemeSync

#### Purpose
Synchronize theme across UI components

#### API
```typescript
interface UseThemeSyncResult {
  isDarkMode: boolean;
  className: string;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

function useThemeSync(): UseThemeSyncResult
```

#### Responsibilities
- Detect system theme preference
- Apply theme class to document
- Provide theme toggle function
- Sync with profile theme setting

### useProfileApplication

#### Purpose
Apply profile state to grid (centralized profile application logic)

#### API
```typescript
interface UseProfileApplicationResult {
  applyProfile: (profile: DataGridStompSharedProfile) => void;
}

function useProfileApplication({
  gridApiRef,
  originalColumnDefsRef,
  gridStateManagerRef,
  providerConfig,
  conditionalFormattingRules,
  gridInstanceId
}: ProfileApplicationProps): UseProfileApplicationResult
```

#### Responsibilities
- Apply column definitions with calculated columns
- Apply conditional formatting to columns
- Apply column groups
- Apply grid state (filters, sorts, etc.)
- Coordinate all profile-related state updates
- Prevent duplicate applications during save

### useIABManagement

#### Purpose
Inter-application bus communication for grid state sharing

#### API
```typescript
function useIABManagement({
  viewInstanceId,
  unsavedGridOptions,
  activeProfileData,
  columnDefs,
  conditionalFormattingRules
}: IABManagementProps): void
```

#### Responsibilities
- Listen for IAB requests for grid configuration
- Broadcast grid state to other applications
- Share column definitions, formatting rules, etc.
- Enable cross-window/cross-app integration

---

## Configuration

### Constants

#### Snapshot Modes
```typescript
export const SNAPSHOT_MODES = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  RECEIVING: 'receiving',
  COMPLETE: 'complete'
} as const;
```

#### Connection Timeouts
```typescript
export const CONNECTION_TIMEOUTS = {
  SNAPSHOT: 60000,  // 60 seconds
  REQUEST: 30000,   // 30 seconds
  RECONNECT: 5000   // 5 seconds
};
```

#### UI Constants
```typescript
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  GRID_REFRESH_DELAY: 100,
  THEME_TRANSITION_DELAY: 50,
  TITLE_RESTORE_DELAY: 1000
};
```

#### Storage Keys
```typescript
export const STORAGE_KEYS = {
  VIEW_TITLE: (viewId: string) => `viewTitle_${viewId}`,
  ACTIVE_PROFILE: (viewId: string) => `activeProfile_${viewId}`
};
```

#### Component Type
```typescript
export const COMPONENT_TYPE = 'DataGridStompShared';
```

#### Initial Grid Options (Read-only)
Array of AG-Grid options that cannot be changed after initialization:
```typescript
export const INITIAL_GRID_OPTIONS = [
  'detailRowHeight',
  'detailRowAutoHeight',
  'enableRtl',
  'scrollbarWidth',
  // ... 40+ more options
];
```

### Grid Configuration

#### Default Column Definition
```typescript
export const DEFAULT_COL_DEF: ColDef = {
  flex: 1,
  minWidth: 100,
  filter: true,
  sortable: true,
  resizable: true,
  enableCellChangeFlash: true,
  useValueFormatterForExport: true
};
```

#### Grid Theme
Uses AG-Grid Quartz theme with custom parameters for light and dark modes.

#### Status Bar Configuration
```typescript
export const getStatusBarConfig = () => ({
  statusPanels: [
    { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
    { statusPanel: 'agTotalRowCountComponent', align: 'center' },
    { statusPanel: 'agFilteredRowCountComponent', align: 'center' },
    { statusPanel: 'agSelectedRowCountComponent', align: 'center' },
    { statusPanel: 'agAggregationComponent', align: 'right' },
    { statusPanel: 'connectionStatusPanel', align: 'right' }
  ]
});
```

#### Grid Performance Configuration
```typescript
export const GRID_PERFORMANCE_CONFIG = {
  asyncTransactionWaitMillis: 50,
  rowBuffer: 10,
  animateRows: false,
  suppressRowHoverHighlight: false,
  cellFlashDuration: 500,
  cellFadeDuration: 1000,
  suppressColumnVirtualisation: false,
  suppressRowVirtualisation: false
};
```

### Profile Defaults

```typescript
export const DEFAULT_PROFILE: DataGridStompSharedProfile = {
  name: 'Default',
  autoLoad: true,
  selectedProviderId: null,
  autoConnect: false,
  sidebarVisible: false,
  theme: 'system',
  showColumnSettings: false,
  asyncTransactionWaitMillis: 50,
  rowBuffer: 10,
  columnGroups: [],
  conditionalFormattingRules: [],
  calculatedColumns: [],
  viewTitle: undefined
};
```

### Grid Options Configuration

200+ grid options organized into categories with metadata:
- Option name
- Type (boolean, number, string, enum)
- Category
- Description
- Default value
- Validation rules (if applicable)

Categories:
1. Display Options
2. Editing Options
3. Selection Options
4. Filtering Options
5. Sorting Options
6. Grouping Options
7. Pagination Options
8. Performance Options
9. Animation Options
10. Advanced Options

---

## Services and Utilities

### GridStateManager

#### Purpose
Comprehensive grid state extraction and application utility

#### Class Structure
```typescript
class GridStateManager {
  private gridApi: GridApi | null;
  private activeColumnGroupIds: string[];
  private pendingColumnState: ColumnState[] | null;

  constructor();

  // Grid API management
  setGridApi(api: GridApi): void;
  getGridApi(): GridApi | null;

  // State extraction
  extractState(options: ExtractOptions): GridState | null;

  // State application
  applyState(state: GridState, options: ApplyOptions): void;

  // Column groups
  setActiveColumnGroupIds(ids: string[]): void;
  getActiveColumnGroupIds(): string[];

  // Pending state
  setPendingColumnState(state: ColumnState[]): void;
  getPendingColumnState(): ColumnState[] | null;
  clearPendingColumnState(): void;

  // Reset
  resetToDefault(): void;
}
```

#### ExtractOptions
```typescript
interface ExtractOptions {
  includeColumnDefs?: boolean;
  includeCustomState?: boolean;
  rowIdField?: string;
}
```

#### ApplyOptions
```typescript
interface ApplyOptions {
  applyColumnState?: boolean;
  applyFilters?: boolean;
  applySorting?: boolean;
  applyGrouping?: boolean;
  applyPagination?: boolean;
  applySelection?: boolean;
  applyExpansion?: boolean;
  applyGridOptions?: boolean;
  applySideBar?: boolean;
  rowIdField?: string;
}
```

#### GridState Structure
```typescript
interface GridState {
  columnState: ColumnState[];
  filterModel: FilterModel;
  sortModel: SortModelItem[];
  groupModel?: any;
  expansionState: string[];
  selectedRows: string[];
  paginationPageSize?: number;
  paginationCurrentPage?: number;
  sideBarState?: any;
  gridOptions?: Record<string, any>;
  columnDefs?: ColDef[];
  activeColumnGroupIds?: string[];
  customState?: Record<string, any>;
  version: string;
  timestamp: number;
}
```

### ColumnGroupService

#### Purpose
Apply and manage column groups in AG-Grid

#### Static Methods
```typescript
class ColumnGroupService {
  /**
   * Apply column groups to column definitions
   */
  static applyColumnGroups(
    columnDefs: ColDef[],
    groups: ColumnGroupDefinition[],
    activeGroupIds: string[]
  ): ColDef[];

  /**
   * Remove column groups and flatten structure
   */
  static removeColumnGroups(columnDefs: ColDef[]): ColDef[];

  /**
   * Migrate old profile column groups to grid-level storage
   */
  static migrateProfileColumnGroups(
    gridInstanceId: string,
    groups: ColumnGroupDefinition[]
  ): string[];

  /**
   * Save column group state
   */
  static saveColumnGroupState(
    gridInstanceId: string,
    gridApi: GridApi,
    groups: ColumnGroupDefinition[]
  ): void;
}
```

#### Apply Column Groups Algorithm
1. Start with base column definitions
2. For each active group:
   - Create group header definition
   - Add columns as children
   - Apply columnGroupShow attribute based on columnStates
   - Set openByDefault flag
3. Add ungrouped columns
4. Return transformed definitions

### Storage Classes

#### GridColumnGroupStorage

Grid-level storage for column group definitions with profile integration.

```typescript
class GridColumnGroupStorage {
  /**
   * Initialize storage with profile management
   */
  static initialize(
    profileManagement: ProfileManagement,
    activeProfile: DataGridStompSharedProfile
  ): void;

  /**
   * Save a column group for a specific grid
   */
  static saveGroup(
    gridInstanceId: string,
    group: ColumnGroupDefinition
  ): void;

  /**
   * Get a specific column group
   */
  static getGroup(
    gridInstanceId: string,
    groupId: string
  ): ColumnGroupDefinition | null;

  /**
   * Get all column groups for a grid
   */
  static getAllGroups(
    gridInstanceId: string
  ): ColumnGroupDefinition[];

  /**
   * Delete a column group
   */
  static deleteGroup(
    gridInstanceId: string,
    groupId: string
  ): void;
}
```

**Storage Key Format**: `grid_${gridInstanceId}_columnGroups`

#### GridConditionalFormattingStorage

Grid-level storage for conditional formatting rules with profile integration.

```typescript
class GridConditionalFormattingStorage {
  /**
   * Initialize storage with profile management
   */
  static initialize(
    profileManagement: ProfileManagement,
    activeProfile: DataGridStompSharedProfile
  ): void;

  /**
   * Save a formatting rule
   */
  static saveRule(
    gridInstanceId: string,
    rule: ConditionalFormattingRule
  ): void;

  /**
   * Get a specific rule
   */
  static getRule(
    gridInstanceId: string,
    ruleId: string
  ): ConditionalFormattingRule | null;

  /**
   * Get multiple rules by IDs
   */
  static getRules(
    gridInstanceId: string,
    ruleIds: string[]
  ): ConditionalFormattingRule[];

  /**
   * Delete a rule
   */
  static deleteRule(
    gridInstanceId: string,
    ruleId: string
  ): void;
}
```

**Storage Key Format**: `grid_${gridInstanceId}_conditionalFormatting`

#### GridCalculatedColumnsStorage

Grid-level storage for calculated column definitions with profile integration.

```typescript
class GridCalculatedColumnsStorage {
  /**
   * Initialize storage with profile management
   */
  static initialize(
    profileManagement: ProfileManagement,
    activeProfile: DataGridStompSharedProfile
  ): void;

  /**
   * Save a calculated column
   */
  static saveColumn(
    gridInstanceId: string,
    column: CalculatedColumnDefinition
  ): void;

  /**
   * Get a specific column
   */
  static getColumn(
    gridInstanceId: string,
    columnId: string
  ): CalculatedColumnDefinition | null;

  /**
   * Get multiple columns by IDs
   */
  static getColumns(
    gridInstanceId: string,
    columnIds: string[]
  ): CalculatedColumnDefinition[];

  /**
   * Delete a column
   */
  static deleteColumn(
    gridInstanceId: string,
    columnId: string
  ): void;
}
```

**Storage Key Format**: `grid_${gridInstanceId}_calculatedColumns`

### WindowManager

#### Purpose
Register and manage window instances for OpenFin integration

#### API
```typescript
class WindowManager {
  static registerViewInstance(
    id: string,
    name: string,
    type: string
  ): void;

  static unregisterViewInstance(id: string): void;

  static getViewInstance(id: string): ViewInstance | null;

  static getAllViewInstances(): ViewInstance[];
}
```

### OpenFinDialogService

#### Purpose
Manage OpenFin portal dialogs for grid configuration

#### API
```typescript
interface DialogOptions {
  name: string;
  route: string;
  data: any;
  windowOptions: WindowOptions;
  onApply?: (data: any) => void;
}

class OpenFinDialogService {
  openDialog(options: DialogOptions): Promise<void>;
  closeDialog(name: string): Promise<void>;
  sendDataToDialog(name: string, data: any): void;
}
```

### SharedWorkerClient

#### Purpose
Client for communicating with STOMP SharedWorker

#### API
```typescript
class SharedWorkerClient extends EventEmitter {
  constructor(options: SharedWorkerOptions);

  connect(): Promise<void>;
  destroy(): void;

  subscribe(providerId: string, config: ProviderConfig): Promise<void>;
  unsubscribe(providerId: string): Promise<void>;
  requestSnapshot(providerId: string): Promise<void>;
  getStatus(providerId: string): Promise<any>;

  // Event emitter methods
  on(event: string, handler: Function): void;
  removeListener(event: string, handler: Function): void;
}
```

#### Events
- `connected`: SharedWorker connected
- `disconnected`: SharedWorker disconnected
- `error`: Error occurred
- `snapshot`: Snapshot data received
- `update`: Real-time update received
- `status`: Status update received

---

## Styling

### CSS Architecture

The component uses a combination of:
1. **Tailwind CSS**: Utility-first CSS framework
2. **Custom CSS**: Component-specific styles in dedicated CSS files
3. **Radix UI**: Unstyled primitives with custom theming
4. **AG-Grid Theming**: Custom Quartz theme configuration

### CSS Files

#### 1. conditionalFormatting.css
Professional styles for conditional formatting dialog.

**Key Classes**:
- `.conditional-formatting-dialog`: Root container
- `.cf-content-wrapper`: Flex layout container
- `.cf-sidebar-panel`: Left sidebar (260px, min 220px)
- `.cf-main-panel`: Center editor panel
- `.cf-rules-list`: Scrollable rules list
- `.cf-rule-item`: Individual rule item with hover
- `.cf-editor-panel`: Expression editor container
- `.cf-formatting-section`: Formatting options panel
- `.cf-footer`: Footer with actions

**Features**:
- Comprehensive color system (theme-aware)
- Professional button styles
- Typography system (consistent font sizes)
- Border and shadow effects
- Scrollbar styling
- Animations (slideIn)
- Responsive adjustments

#### 2. gridOptions/styles.css
Microsoft-style property grid for grid options editor.

**Key Classes**:
- `.grid-options-property-grid`: Property grid container
- `.grid-options-scroll-area`: Scrollable area with custom scrollbar
- `.grid-options-accordion-trigger`: Category headers
- `.grid-options-footer`: Footer with actions

**Features**:
- Property row hover effects
- Modified property indicator (primary color)
- Custom scrollbar (dark mode compatible)
- Accordion chevron rotation
- Compact font sizes (12px properties, 11px categories)

#### 3. calculatedColumns/calculatedColumns.css
Layout styles for calculated columns editor.

**Key Classes**:
- `.calculated-columns-dialog`: Root flex container
- `.cc-content-wrapper`: Two-panel layout
- `.cc-sidebar-panel`: Left column list (350px)
- `.cc-main-panel`: Right editor panel
- `.cc-column-item`: Column list item with selection state
- `.cc-footer-actions`: Footer buttons

**Features**:
- Flexible two-column layout
- Hover and selection states
- Empty state styling
- Responsive adjustments

### Tailwind Configuration

The component uses Tailwind utility classes extensively:

**Common Patterns**:
```css
/* Layout */
.flex .flex-col .h-full
.flex-1 .min-h-0
.overflow-hidden .overflow-auto

/* Spacing */
.p-4 .px-6 .py-3
.gap-2 .gap-4
.space-y-4

/* Colors */
.bg-background .bg-card .bg-muted
.text-foreground .text-muted-foreground
.border .border-border

/* Typography */
.text-sm .text-xs .text-lg
.font-medium .font-semibold
.truncate

/* Interactivity */
.hover:bg-accent .hover:text-accent-foreground
.transition-colors .transition-all
.cursor-pointer

/* Dark mode */
.dark:bg-gray-800 .dark:text-white
```

### Theme Variables

Defined in CSS custom properties:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  --primary: 178 33% 59%;  /* Teal accent */
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 178 33% 59%;
}

.dark {
  --background: 0 0% 9%;
  --foreground: 0 0% 98%;
  --card: 0 0% 12%;
  --card-foreground: 0 0% 98%;
  /* ... dark mode values */
}
```

### AG-Grid Theme Customization

Custom Quartz theme with dual color schemes:

```typescript
export const GRID_THEME = themeQuartz
  .withParams({
    // Light mode params
    accentColor: "#8AAAA7",
    backgroundColor: "#E6E6E6",
    cellTextColor: "#000000",
    headerBackgroundColor: "#D9D9D9D6",
    oddRowBackgroundColor: "#DCDCDCE8",
    fontSize: 14,
    fontFamily: { googleFont: "Inter" },
    spacing: 6,
    // ... more params
  }, "light")
  .withParams({
    // Dark mode params
    accentColor: "#8AAAA7",
    backgroundColor: "#171717",
    foregroundColor: "#FFF",
    oddRowBackgroundColor: "#1f1f1f",
    fontSize: 14,
    fontFamily: { googleFont: "Inter" },
    spacing: 6,
    // ... more params
  }, "dark");
```

### Responsive Design

#### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 768px
- **Desktop**: > 768px

#### Responsive Adjustments
- Dialog padding reduces on smaller screens
- Font sizes adjust for readability
- Button sizes scale down
- Grid layouts become single-column on mobile

---

## Data Flow

### Component Initialization Flow

```
1. Component Mount
   ↓
2. Initialize Hooks
   - useSharedWorkerConnection
   - useProviderConfig
   - useGridState
   - useProfileManagement
   - ... other hooks
   ↓
3. Load Active Profile
   ↓
4. Apply Profile to Grid
   - Set provider
   - Apply grid state
   - Apply column groups
   - Apply formatting rules
   ↓
5. Auto-Connect (if enabled)
   ↓
6. Request Snapshot
   ↓
7. Receive Data
   ↓
8. Grid Ready for Interaction
```

### Profile Loading Flow

```
1. User Selects Profile
   ↓
2. Load Profile Data (Config Service)
   ↓
3. Profile Change Handler Triggered
   ↓
4. Store Profile in Pending Ref
   ↓
5. Clear Unsaved Changes
   ↓
6. Update UI State (sidebar, etc.)
   ↓
7. Apply Profile to Grid (if grid ready)
   - Transform column definitions
   - Apply calculated columns
   - Apply conditional formatting
   - Apply column groups
   - Apply grid state
   ↓
8. Mark Profile as Applied
```

### Profile Saving Flow

```
1. User Clicks Save
   ↓
2. Set Saving Flag (prevent reapplication)
   ↓
3. Extract Current Grid State
   - Column state
   - Filter model
   - Sort model
   - Expansion state
   - Selection
   - Pagination
   ↓
4. Include Unsaved Changes
   - Grid options
   - Column groups
   ↓
5. Build Profile Object
   ↓
6. Call saveProfile (Config Service)
   ↓
7. Clear Unsaved Changes
   ↓
8. Clear Saving Flag
   ↓
9. Show Success Toast
```

### Connection and Data Flow

```
SharedWorker           Grid Component         STOMP Server
     |                       |                      |
     |<--- connect() --------|                      |
     |                       |                      |
     |--- subscribe() ---------------------->|      |
     |                       |                      |
     |--- requestSnapshot() --------------->|      |
     |                       |                      |
     |<---- snapshot batch -------------------|     |
     |                       |                      |
     |--> snapshot event --->|                      |
     |                       |                      |
     |     (accumulate data) |                      |
     |                       |                      |
     |<---- end token ----------------------|      |
     |                       |                      |
     |--> snapshot complete->|                      |
     |                       |                      |
     |     (set all data)    |                      |
     |                       |                      |
     |<---- real-time update ----------------|     |
     |                       |                      |
     |--> update event ----->|                      |
     |                       |                      |
     |  (apply transaction)  |                      |
```

### Column Customization Flow

#### Column Groups
```
1. User Opens Column Groups Dialog
   ↓
2. Dialog Receives:
   - Current column definitions
   - Saved groups (from profile)
   - Active group IDs
   ↓
3. User Creates/Edits Groups
   - Select columns
   - Set open/close states
   - Check/uncheck to activate
   ↓
4. User Clicks Apply
   ↓
5. Dialog Sends to Main:
   - Active group IDs
   - All group definitions
   ↓
6. Main Component:
   - Saves groups to grid-level storage
   - Updates profile with group IDs
   - Applies groups to column definitions
   ↓
7. Grid Refreshes with New Column Structure
```

#### Conditional Formatting
```
1. User Opens Formatting Dialog
   ↓
2. Dialog Receives:
   - Column definitions
   - Current rules (from profile)
   - Active rule IDs
   ↓
3. User Creates/Edits Rules
   - Write expression
   - Configure formatting
   - Enable/disable rules
   ↓
4. User Clicks Apply
   ↓
5. Dialog Sends to Main:
   - Active rule IDs
   - All rule definitions
   ↓
6. Main Component:
   - Saves rules to grid-level storage
   - Updates profile with rule IDs
   - Applies formatting to column definitions
   - Generates rowClassRules
   ↓
7. Grid Refreshes with New Formatting
```

#### Calculated Columns
```
1. User Opens Calculated Columns Dialog
   ↓
2. Dialog Receives:
   - Column definitions
   - Current columns (from profile)
   - Active column IDs
   ↓
3. User Creates/Edits Columns
   - Write expression
   - Configure properties
   - Enable/disable columns
   ↓
4. User Clicks Apply
   ↓
5. Dialog Sends to Main:
   - Active column IDs
   - All column definitions
   ↓
6. Main Component:
   - Saves columns to grid-level storage
   - Updates profile with column IDs
   - Adds calculated columns to column definitions
   ↓
7. Grid Refreshes with New Columns
```

### Grid Options Flow

```
1. User Opens Grid Options Dialog
   ↓
2. Dialog Receives:
   - Current grid options (from profile or defaults)
   - Profile name
   ↓
3. User Modifies Options
   - Change values
   - Visual feedback for modified options
   ↓
4. User Clicks Apply
   ↓
5. Dialog Sends Updated Options
   ↓
6. Main Component:
   - Stores as unsaved changes
   - Applies to grid via setGridOption()
   - Shows unsaved indicator
   ↓
7. Grid Updates Dynamically
   ↓
8. On Profile Save:
   - Options saved to profile
   - Unsaved indicator cleared
```

---

## Storage Architecture

### NEW Architecture (Current)

#### Profile-Based Storage
All grid customizations (column groups, formatting rules, calculated columns) are stored **directly in the profile** via Config Service.

#### Grid-Level Storage (Metadata)
The `GridXXXStorage` classes provide a **secondary storage layer** for:
1. **Cross-profile sharing**: Definitions can be accessed by any profile
2. **Quick access**: Fast lookup without loading entire profile
3. **Migration support**: Converts old localStorage data to new format

#### Storage Flow
```
Profile (Config Service)
  ├── columnGroups: ["group-id-1", "group-id-2"]  (IDs only)
  ├── conditionalFormattingRules: ["rule-1", "rule-2"]  (IDs only)
  └── calculatedColumns: ["calc-1", "calc-2"]  (IDs only)

Grid-Level Storage (localStorage)
  ├── grid_${gridId}_columnGroups:
  │     { "group-id-1": {...full definition...} }
  ├── grid_${gridId}_conditionalFormatting:
  │     { "rule-1": {...full rule...} }
  └── grid_${gridId}_calculatedColumns:
        { "calc-1": {...full column...} }
```

#### Benefits
- **Profile size**: Profiles only store IDs, reducing size
- **Sharing**: Definitions can be shared across profiles
- **Performance**: Fast access to definitions without parsing large profile
- **Flexibility**: Easy to add/remove customizations

### Migration Strategy

#### From Old Format (v1)
Old profiles stored full objects in profile:
```json
{
  "columnGroups": [
    { "id": "group-1", "headerName": "Trading", "children": [...] }
  ]
}
```

#### To New Format (v2)
Profiles store only IDs:
```json
{
  "columnGroups": ["group-1"]
}
```

Definitions stored in grid-level storage:
```json
{
  "grid_xxx_columnGroups": {
    "group-1": { "id": "group-1", "headerName": "Trading", "children": [...] }
  }
}
```

#### Migration Process
1. Storage classes check if profile has old format
2. If yes, extract definitions and save to grid-level storage
3. Update profile with just IDs
4. Save updated profile
5. Delete old localStorage keys (if any)

### Storage Class Initialization

Each storage class must be initialized with profile management:

```typescript
// In main component
useEffect(() => {
  if (activeProfileData) {
    GridColumnGroupStorage.initialize(
      { updateProfilePartial: (updates) => saveProfile({...activeProfileData, ...updates}, false, activeProfileData.name) },
      activeProfileData
    );
    GridConditionalFormattingStorage.initialize(...);
    GridCalculatedColumnsStorage.initialize(...);
  }
}, [activeProfileData, saveProfile]);
```

This enables storage classes to:
- Save updates directly to profile
- Perform automatic migration
- Coordinate with profile versioning

---

## Best Practices for Future Development

### 1. Adding New Customization Features

When adding a new grid customization feature (e.g., "Grid Themes"):

1. **Create Storage Class**
```typescript
// gridThemesStorage.ts
export class GridThemesStorage {
  static initialize(profileMgmt, profile) { ... }
  static saveTheme(gridId, theme) { ... }
  static getTheme(gridId, themeId) { ... }
}
```

2. **Update Profile Type**
```typescript
interface DataGridStompSharedProfile {
  // ... existing
  themes?: string[]; // Theme IDs
}
```

3. **Create Dialog Component**
```typescript
// ThemesEditorContent.tsx
export const ThemesEditorContent = ({
  currentThemes,
  activeThemeIds,
  onApply
}) => { ... }
```

4. **Add Hook for Management**
```typescript
// useThemeManagement.ts
export function useThemeManagement({
  gridApi,
  activeProfileData,
  gridInstanceId
}) {
  const handleApplyThemes = useCallback((activeIds, allThemes) => {
    // Save to grid-level storage
    // Update profile
    // Apply to grid
  }, []);

  return { handleApplyThemes };
}
```

5. **Integrate in Main Component**
```typescript
// In index.tsx
const { handleApplyThemes } = useThemeManagement({...});

// In useDialogManagement
const handleOpenThemes = useCallback(async () => {
  await dialogService.openDialog({
    name: `themes-${viewInstanceId}`,
    route: '/themes',
    data: { currentThemes, activeThemeIds },
    onApply: (data) => handleApplyThemes(data.activeIds, data.allThemes)
  });
}, []);
```

### 2. Performance Optimization Guidelines

1. **Use Refs for Non-UI State**
```typescript
// Good - doesn't trigger re-render
const counterRef = useRef(0);

// Bad - triggers re-render on every change
const [counter, setCounter] = useState(0);
```

2. **Memoize Expensive Computations**
```typescript
const transformedData = useMemo(() => {
  return expensiveTransformation(data);
}, [data]);
```

3. **Stabilize Callbacks**
```typescript
const handleClick = useCallback(() => {
  // handler logic
}, [/* minimal dependencies */]);
```

4. **Batch Updates**
```typescript
// AG-Grid transaction batching
gridApi.applyTransactionAsync({ update: rows }, (result) => {
  console.log('Batch complete:', result);
});
```

5. **Avoid Cascading Effects**
```typescript
// Bad - effect triggers effect
useEffect(() => {
  setStateA(value);
}, [dependency]);

useEffect(() => {
  setStateB(stateA); // Cascading update
}, [stateA]);

// Good - single effect
useEffect(() => {
  setStateA(value);
  setStateB(deriveFromValue(value));
}, [dependency]);
```

### 3. Hook Design Principles

1. **Single Responsibility**: Each hook does one thing well
2. **Stable API**: Return stable references (useCallback, useMemo)
3. **Minimal Dependencies**: Only include truly required dependencies
4. **Clear Naming**: Hook name describes what it does
5. **Documentation**: JSDoc comments for complex hooks

### 4. State Management Strategy

**When to use useState**:
- UI-reactive state (affects rendering)
- Simple values
- Need previous value access

**When to use useRef**:
- Non-UI state (doesn't affect rendering)
- DOM references
- Previous value storage
- Mutable values that don't need to trigger updates

**When to use useReducer**:
- Complex state logic
- Multiple related state updates
- State transitions with rules

### 5. Testing Considerations

1. **Isolate Hooks**: Test hooks independently with @testing-library/react-hooks
2. **Mock Dependencies**: Mock AG-Grid API, SharedWorker, etc.
3. **Test State Transitions**: Verify state changes correctly
4. **Test Error Handling**: Ensure errors are caught and handled
5. **Test Cleanup**: Verify useEffect cleanups are called

### 6. Documentation Standards

1. **Component Documentation**:
   - Purpose and responsibilities
   - Props/API documentation
   - Usage examples
   - Dependencies

2. **Hook Documentation**:
   - What it does
   - Parameters
   - Return value
   - Side effects

3. **Type Documentation**:
   - Interface purpose
   - Field descriptions
   - Validation rules

### 7. Code Organization

1. **File Structure**: Follow established patterns
2. **Import Order**:
   - React imports
   - Third-party libraries
   - Internal utilities
   - Components
   - Types
   - Styles

3. **Naming Conventions**:
   - Components: PascalCase
   - Hooks: camelCase with "use" prefix
   - Constants: UPPER_SNAKE_CASE
   - Utilities: camelCase
   - Types: PascalCase with "Interface" or "Type" suffix (when needed)

---

## Summary

The **DataGridStompShared** component is a production-ready, enterprise-grade data grid solution that demonstrates:

- **Modern React Patterns**: Hooks, refs, memoization, context
- **Performance Optimization**: Minimal re-renders, batched updates, virtualization
- **Modular Architecture**: Separated concerns, reusable hooks, clean interfaces
- **Comprehensive Features**: Profile management, real-time data, extensive customization
- **Professional UI**: Polished dialogs, consistent styling, responsive design
- **Robust State Management**: Full state capture/restore, versioning, migration support
- **OpenFin Integration**: Portal dialogs, window management, IAB communication
- **AG-Grid Mastery**: Advanced features, custom components, theming

This documentation provides a complete blueprint for understanding, maintaining, and extending the DataGridStompShared component.

---

## Appendix A: Project Memory & Implementation History

This section contains the complete project memory from CLAUDE.md, documenting the evolution, fixes, and learnings from the DataGridStompShared component development.

### A.1 StompDatasourceProvider - Fixed Implementation

#### Overview
The StompDatasourceProvider has been refactored to properly handle the STOMP server lifecycle with clear separation between snapshot and real-time modes, based on the correct lifecycle explanation provided.

#### STOMP Server Lifecycle (Correct Implementation)

1. **Connection Phase**
   - Client connects to WebSocket
   - Establishes STOMP connection

2. **Snapshot Phase**
   - Subscribe to listener topic
   - Send 'REQUESTING_SNAPSHOT_DATA' event
   - Send snapshot request message (trigger)
   - Server sends data in batches
   - Server sends end token when complete
   - Client sends 'SNAPSHOT_COMPLETE' event

3. **Real-time Phase**
   - Subscribe to updates (might be same or different topic)
   - Receive continuous updates
   - Apply updates using transactions

#### Key Implementation Changes

##### 1. Lifecycle Events
```typescript
// Added to StompStatistics
mode: 'idle' | 'snapshot' | 'realtime'

// New events emitted
provider.emit('REQUESTING_SNAPSHOT_DATA')
provider.emit('SNAPSHOT_COMPLETE', { rowCount, duration })
```

##### 2. Snapshot Handling
- Check for end token FIRST before processing data
- Support batch processing with callback
- Accumulate data during snapshot phase
- Emit SNAPSHOT_COMPLETE when end token received

##### 3. Real-time Updates
```typescript
// New method for real-time subscription
async subscribeToRealtimeUpdates(onUpdate: (data: any[]) => void): Promise<void>

// Unsubscribe method
unsubscribeFromRealtimeUpdates(): void
```

#### DataTable Integration

##### Snapshot Mode Handling
```typescript
// Listen for lifecycle events
subscriberRef.current.subscribe('REQUESTING_SNAPSHOT_DATA');
subscriberRef.current.subscribe('SNAPSHOT_COMPLETE');

// Track snapshot state
const [snapshotMode, setSnapshotMode] = useState<'idle' | 'requesting' | 'receiving' | 'complete'>('idle');

// Accumulate data during snapshot
const snapshotDataRef = useRef<RowData[]>([]);

// On SNAPSHOT_COMPLETE, set all data at once
setRowData(snapshotDataRef.current);
```

##### Real-time Mode Handling
```typescript
// After snapshot complete, use applyTransactionAsync
const transaction = {
  update: data.updates  // AG-Grid automatically handles add/update based on row ID
};
gridApiRef.current.applyTransactionAsync(transaction);
```

#### Provider Window Updates

1. **Removed old subscribeToUpdates() method** - now uses provider's subscribeToRealtimeUpdates()

2. **Event forwarding** - forwards lifecycle events to DataTable:
   - REQUESTING_SNAPSHOT_DATA
   - SNAPSHOT_COMPLETE

3. **Batch processing during snapshot** - publishes batches as they arrive

4. **Proper cleanup** - unsubscribes from real-time updates on stop

#### Configuration (StompConfig)
```typescript
interface StompConfig {
  websocketUrl: string;      // WebSocket URL
  listenerTopic: string;     // Topic to subscribe to
  requestMessage?: string;   // Topic to send snapshot request
  requestBody?: string;      // Body of snapshot request
  snapshotEndToken?: string; // Token indicating end of snapshot
  keyColumn?: string;        // Key field for row identification
  messageRate?: string;      // Expected message rate
  snapshotTimeoutMs?: number; // Snapshot timeout (default: 60000)
}
```

#### Flow Diagram
```
DataTable                Provider              STOMP Server
    |                       |                       |
    |---- getSnapshot ----->|                       |
    |<- REQUESTING_DATA ----|                       |
    |                       |--- Subscribe -------->|
    |                       |--- Send Request ----->|
    |                       |<---- Batch 1 ---------|
    |<---- update (batch) --|                       |
    |                       |<---- Batch 2 ---------|
    |<---- update (batch) --|                       |
    |                       |<---- End Token -------|
    |<- SNAPSHOT_COMPLETE --|                       |
    |                       |                       |
    |                       |-- Subscribe Updates ->|
    |                       |<--- Real-time Data ---|
    |<--- update (realtime)-|                       |
```

---

### A.2 Provider Pool Architecture Plan

#### Overview
After fixing StompDatasourceProvider, implement a provider pool architecture that:
- Reduces OS windows from 100 to 5-10
- NO WebSocket connection sharing (each provider keeps its own)
- Simple architecture without message routing complexity

#### Key Design Decisions
1. Each provider maintains its own WebSocket connection
2. Workers only share window/process overhead, not connections
3. No message demultiplexing needed
4. Expected 90% memory reduction through window consolidation

#### Implementation Plan
See: `/mnt/c/Users/developer/Documents/provider-pool-implementation-plan.md`

---

### A.3 Current Working State

#### What's Working:
- STOMP provider properly implements snapshot and real-time lifecycle
- Clear separation between snapshot and real-time modes
- Proper event emission for lifecycle tracking
- DataTable correctly handles both modes
- End token detection works correctly
- Batch processing during snapshot

#### Fixed Issues:
1. ✅ StompDatasourceProvider now follows correct lifecycle
2. ✅ Snapshot data properly delivered with batching
3. ✅ End token checked before processing data
4. ✅ Clear mode separation (snapshot vs real-time)
5. ✅ Proper event lifecycle (REQUESTING_SNAPSHOT_DATA, SNAPSHOT_COMPLETE)

#### Next Steps:
1. Implement provider pool architecture for better scaling
2. Add reconnection logic with exponential backoff
3. Implement circuit breaker for failing connections

#### Important Commands:
- Lint code: `npm run lint`
- Type check: `npm run typecheck`
- These commands should be run before committing changes

---

### A.4 Session Updates (2025-08-01)

#### 1. Grid Options Performance Optimization
**Problem**: Apply Changes button taking over 3 seconds to save 200 options
**Solution**:
- Implemented batch updates using `requestAnimationFrame`
- Only update options that actually changed
- Added performance timing logs
- Reduced update time from 3+ seconds to milliseconds

```typescript
// Performance optimization in handleApplyGridOptions
const changedOptions: Record<string, any> = {};
Object.entries(newOptions).forEach(([key, value]) => {
  if (key !== 'font' && currentOptions[key] !== value) {
    changedOptions[key] = value;
  }
});

requestAnimationFrame(() => {
  Object.entries(changedOptions).forEach(([key, value]) => {
    gridApi.setGridOption(key, value);
  });
});
```

#### 2. Column Group Editor Implementation
**Feature**: Complete column group editor based on specification
**Components Created**:
- `ColumnGroupEditor.tsx` - Main editor component
- `ColumnGroupService.ts` - Service for applying groups to AG-Grid
- `types.ts` - TypeScript interfaces

**Key Features**:
- Two-panel layout (groups list and column selection)
- Create/update/delete column groups
- Column visibility control (open/closed/default states)
- Proper state management
- Integration with AG-Grid API

#### 3. Column Group Persistence
**Feature**: Save column groups with profile
**Implementation**:
- Added `columnGroups` to `DataGridStompSharedProfile` interface
- Added `unsavedColumnGroups` state for temporary changes
- Column groups saved when profile is saved
- Column groups loaded and applied when profile loads

#### 4. Column Group Show Implementation
**Feature**: Control column visibility based on group expand/collapse state
**Implementation**:
- Added `columnStates` to `ColumnGroupDefinition`:
  ```typescript
  columnStates?: Record<string, 'open' | 'closed' | undefined>;
  ```
- Applied `columnGroupShow` attribute to columns:
  - `'open'` - Column only visible when group is expanded
  - `'closed'` - Column only visible when group is collapsed
  - `undefined` - Column always visible

#### 5. Bug Fixes

##### a. Column Groups Not Applying on Load
**Problem**: Groups saved but not applied when component loads
**Solution**:
- Added effect to apply column groups after grid is ready
- Handle null `columnApi` for newer AG-Grid versions
- Added 500ms delay to ensure grid initialization

##### b. Dropdown Portal Issue
**Problem**: Select dropdowns opening in parent window
**Solution**: Created and used `NoPortalSelect` component that renders dropdowns locally

##### c. Column Groups Dialog Not Opening
**Problem**: Menu click didn't open dialog
**Solution**:
- Fixed OpenFinPortalDialog to handle existing windows in bad state
- Added force close for stuck windows
- Added timeout for window ready check

##### d. Layout Issues
**Problem**: Poor layout in column group editor (from screenshot)
**Solution**:
- Fixed flexbox layout structure
- Added proper scrollable areas
- Made sidebar wider
- Positioned buttons correctly

#### 6. Enhanced Debugging
**Added Extensive Logging**:
- Column group creation and updates
- Column definitions before and after applying
- Group expand/collapse behavior testing
- API method availability checks
- Detailed verification of applied configurations

#### 7. Testing Utilities
**Created Test Helpers**:
- `testColumnGroupShow.ts` - Test configuration demonstrator
- Automatic expand/collapse testing after applying groups
- Console verification of column visibility states

#### 8. UI/UX Improvements
- Changed from checkboxes to proper Select components for column options
- Added visual feedback for selected columns
- Improved button placement and spacing
- Added "Clear All" functionality
- Better error messages and toasts

#### 9. State Management Improvements
- Separated saved vs unsaved changes for both grid options and column groups
- Proper cleanup when switching profiles
- Consistent state updates across all operations

#### 10. API Compatibility
- Added checks for both `columnApi` and `gridApi` methods
- Handle AG-Grid version differences gracefully
- Fallback approaches for missing methods

---

### A.5 Recent Updates (2025-07-15)

#### End Token Detection Enhancement
- Changed from exact string match to case-insensitive contains check
- Now uses `messageBody.toLowerCase().includes(endToken.toLowerCase())`
- Handles variations like "Success", "SUCCESS", or messages containing the token

#### DataTable Performance Updates

##### AG-Grid Configuration
```typescript
// Added to AgGridReact component
enableCellChangeFlash={true}           // Built-in cell flashing
asyncTransactionWaitMillis={50}        // Batch updates for performance
statusBar={{...}}                      // Added status bar with row counts
```

##### Real-time Updates Implementation
```typescript
// Simplified to use AG-Grid best practices
const transaction = {
  update: data.updates
};
// Using applyTransactionAsync for better performance
const result = gridApiRef.current.applyTransactionAsync(transaction);
```

##### Key Changes Made:
1. **Removed custom CellFlashService** - Using AG-Grid's built-in `enableCellChangeFlash`
2. **Simplified transaction logic** - Let AG-Grid determine add vs update based on row ID
3. **Added defensive checks** in getRowId function
4. **Using forEachNode** for safer row data access (fixed initial implementation)
5. **Added key column validation** before applying updates

#### Performance Issues (HISTORICAL - MAY BE RESOLVED)

##### Symptoms:
- DataTable was sluggish when receiving updates
- Real-time updates were causing performance degradation

##### Potential Causes:
1. **Snapshot Data Handling**:
   - Was using `setRowData()` which replaces all data
   - During snapshot, calling setRowData multiple times as batches arrive
   - Should accumulate all snapshot data and set once at the end

2. **Update Frequency**:
   - May be receiving updates too frequently
   - Even with `asyncTransactionWaitMillis`, updates might be overwhelming

3. **Row Data Size**:
   - Large datasets might need virtual scrolling or pagination
   - Current implementation loads all data into memory

4. **Grid Redrawing**:
   - Multiple setRowData calls during snapshot cause full grid redraws
   - Should use immutable data updates

##### Recommended Fixes Applied:

1. **Optimized Snapshot Loading**:
```typescript
// Don't update grid during snapshot receiving
if (snapshotMode === 'receiving') {
  snapshotDataRef.current.push(...data.updates);
  // Don't call setRowData here
} else if (snapshotMode === 'complete') {
  // Set all data once when complete
  setRowData(snapshotDataRef.current);
}
```

2. **Row Virtualization Enabled**:
```typescript
rowBuffer={10}
rowModelType={'clientSide'}
animateRows={false}  // Disable during snapshot
suppressRowHoverHighlight={true}
suppressCellFocus={true}
```

3. **Debounced Updates**:
```typescript
// Consider debouncing real-time updates
const debouncedUpdate = useMemo(
  () => debounce((updates) => {
    gridApiRef.current?.applyTransactionAsync({ update: updates });
  }, 100),
  []
);
```

#### Provider Window Batch Handling
- Fixed to send only new items in each batch, not accumulated data
- Tracks `previousLength` to slice only new items
- This prevents sending increasingly large payloads

#### Error Handling
- Added try-catch blocks around transaction application
- Better error logging for debugging
- Fallback mechanisms if transactions fail

---

### A.6 DataGridStompShared Refactoring Plan (2025-07-30)

#### Overview
Plan to refactor the 1464-line DataGridStompShared component into smaller, focused modules while preventing re-renders and infinite loops.

#### Goals
- Modularize into smaller, focused modules
- **PREVENT re-renders and infinite loops**
- Preserve ALL existing features, behaviors, styling, and functions
- Make the component simpler and more performant
- Improve maintainability

#### Key Performance Principles
1. **Stable References**: Use `useCallback`, `useMemo`, and `useRef` appropriately
2. **Proper Dependencies**: Ensure all hook dependencies are correctly specified
3. **Avoid State Cascades**: Prevent state updates that trigger other state updates
4. **Ref-based Values**: Use refs for values that don't need to trigger re-renders

#### Refactoring Strategy to Prevent Issues

##### 1. State Management
- Group related state to reduce update cycles
- Use refs for non-UI state (messageCountRef, isConnecting, etc.)
- Implement state reducers for complex state logic

##### 2. Effect Optimization
- Combine related effects where possible
- Use cleanup functions properly
- Avoid effects that depend on frequently changing values

##### 3. Callback Stability
- Wrap all event handlers in useCallback
- Use refs to access latest values without adding dependencies
- Create handler factories that return stable functions

##### 4. Component Structure

```typescript
// Main component becomes much simpler:
const DataGridStompShared = () => {
  // Custom hooks with stable APIs
  const connection = useSharedWorkerConnection(selectedProviderId);
  const snapshot = useSnapshotData(connection);
  const providerConfig = useProviderConfig(selectedProviderId);
  const gridState = useGridState(gridApiRef, activeProfileData);
  const theme = useThemeSync(appTheme);

  // Memoized handlers
  const handlers = useMemo(() => ({
    onConnect: () => connection.connect(providerConfig),
    onDisconnect: () => connection.disconnect(),
    onProfileSave: () => profileManagement.save(getCurrentState()),
  }), [connection, providerConfig, profileManagement]);

  return (
    <div className={theme.className}>
      <Toolbar {...handlers} />
      <BusyIndicator {...snapshot} />
      <DataGrid
        config={gridConfig}
        data={snapshot.data}
        onReady={gridState.onReady}
      />
    </div>
  );
};
```

#### Performance Guarantees

1. **No Infinite Loops**:
   - All effects have proper dependency arrays
   - State updates don't trigger cascading updates
   - Refs used for values that don't affect UI

2. **Minimal Re-renders**:
   - Components wrapped in React.memo
   - Callbacks memoized with useCallback
   - Complex computations memoized with useMemo

3. **Stable Hook APIs**:
   - Hooks return stable references
   - Internal state changes don't propagate unnecessarily
   - Clear separation between UI state and operational state

This refactoring has been successfully implemented, making the component much simpler, more maintainable, and more performant than the original implementation.

---

### A.7 AG-Grid Column Customization Dialog (2025-08-01)

#### Overview
Comprehensive plan for implementing an advanced AG-Grid column customization dialog system with extensive customization capabilities.

#### Key Features
- Multi-dialog architecture with main dialog and specialized sub-dialogs
- Comprehensive customization options for columns including:
  - Cell renderers and value formatters
  - Cell editors with validation
  - Filters and filter parameters
  - Cell and header styling (colors, fonts, borders, alignment)
  - Conditional formatting rules
  - Calculated columns with formulas
  - Column-level permissions
  - Named filter queries
- Minimal storage principle - only saves customizations that differ from defaults
- Performance optimizations including lazy loading and virtualization

#### Documentation Reference
See: `/mnt/c/Users/developer/Documents/projects/agv3/documents/AG-GRID_COLUMN_CUSTOMIZATION_DIALOG_PLAN.md`

This comprehensive document includes:
- Detailed tab specifications (General, Display, Styling, Editing, Filtering)
- Advanced sub-dialog specifications
- Data storage strategy
- Implementation recommendations
- Performance considerations

---

### A.8 Conditional Formatting Dialog Improvements (2025-08-04)

#### Overview
Major redesign and enhancement of the conditional formatting dialog to create a professional, sophisticated interface with improved UX.

#### Key Improvements

##### 1. Complete UI Redesign
- **Layout**: Implemented resizable panels using react-resizable-panels
- **Visual Hierarchy**: Professional spacing and consistent design patterns
- **Responsive Design**: Adapts to different screen sizes
- **Theme Compatibility**: Works seamlessly with light/dark themes

##### 2. Expression Editor Enhancements
- **Keyboard Shortcuts**:
  - Ctrl+Shift+C - Show only columns in IntelliSense
  - Ctrl+Shift+F - Show only functions
  - Ctrl+Shift+V - Show only variables
  - Ctrl+Shift+O - Show only operators
- **Responsive Width**: Adapts layout based on container width
- **Removed Sidebar**: Replaced with popover buttons for examples
- **Full Container Support**: Now fills parent container properly

##### 3. Rule List Improvements
- **Minimalist Design**: Simple rule items showing only title
- **Tooltip Information**: All details shown on hover
- **Modern Icons**: Replaced with subtle monochromatic indicators
- **Clean Interactions**: Smooth hover and selection states

##### 4. Multi-Select Column Selector
- **Searchable**: Filter columns by name
- **Cell-Only Rules**: Select specific columns for rule application
- **Visual Feedback**: Clear indication of selected columns

##### 5. Professional Styling
- **Custom CSS**: Comprehensive styles in conditionalFormatting.css
- **Consistent Spacing**: Professional layout throughout
- **Modern Icons**: Updated all icons to be sophisticated
- **Smooth Animations**: Subtle transitions and effects

#### Implementation Details

##### Files Modified
1. `ConditionalFormattingApp.tsx` - Fixed imports, set window title
2. `ConditionalFormattingEditorContent.tsx` - Added resizable panels
3. `RuleListItem.tsx` - Complete redesign with minimalist approach
4. `ExpressionEditor.tsx` - Made fully responsive
5. `GridConfigurationBus.ts` - Fixed channel cleanup
6. `RuleEditorSimplified.tsx` - Added column selector
7. `conditionalFormatting.css` - Professional styling

##### New Components
- `MultiSelect` - Searchable multi-select component
- `FilteredCompletionProvider` - IntelliSense filtering

#### Technical Improvements
1. **Fixed Temporal Dead Zone Errors**: Reordered code execution
2. **Fixed JSX Structure**: Corrected missing closing tags
3. **Fixed Runtime Errors**: Handled undefined callbacks
4. **Fixed Channel Cleanup**: Proper destroy/disconnect handling
5. **Fixed Portal Issues**: Created NoPortalSelect components

#### UI/UX Enhancements
1. **Rule Item Design**:
   - Minimal display with just title and status
   - Comprehensive tooltip with all information
   - Theme-aware colors and styling
   - Subtle monochromatic icons (Minus icon)

2. **Expression Editor**:
   - Responsive breakpoints (400px, 600px, 900px)
   - Dynamic Monaco Editor options
   - Adaptive UI elements
   - Smart feature toggling

3. **Dialog Layout**:
   - Resizable panels for flexible workspace
   - Minimum 220px width for sidebar
   - Professional button spacing
   - Clean visual hierarchy

#### Performance Optimizations
1. **ResizeObserver**: Real-time container size detection
2. **Automatic Layout**: Monaco Editor auto-adjusts
3. **Smart Features**: Resource-intensive features disabled on small screens
4. **Memoized Components**: Reduced unnecessary re-renders

#### Current State
The conditional formatting dialog is now:
- ✅ Professional and sophisticated
- ✅ Fully responsive
- ✅ Theme-compatible
- ✅ Minimalist and elegant
- ✅ Feature-complete with keyboard shortcuts
- ✅ Optimized for performance

---

**Document Version**: 1.1
**Last Updated**: 2025-10-09
**Component Version**: Based on major-openfin-refactor branch
**Includes**: Complete project memory and implementation history
