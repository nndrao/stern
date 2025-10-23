# AGV3 STOMP Datasource Configuration - Complete Feature Analysis

This document provides a comprehensive analysis of the AGV3 STOMP Datasource Configuration implementation for replication in the Stern project.

## Overview

The AGV3 implementation provides a sophisticated 3-tab interface for configuring STOMP data providers with the following capabilities:
1. **Connection Tab** - Configure STOMP connection and topic settings
2. **Fields Tab** - Infer and select fields from live data with tree view
3. **Columns Tab** - Configure AG-Grid column definitions with formatters and renderers

## Architecture Overview

### File Structure
```
agv3/src/windows/datasource-config/
├── App.tsx                          # Main container with sidebar + content
├── components/
│   ├── StompConfigurationDialog.tsx  # Main 3-tab interface
│   ├── FieldSelector.tsx            # Reusable field selector component
│   ├── TreeItem.tsx                 # Tree view item with expand/collapse
│   ├── AppVariablesConfiguration.tsx # Separate Variables datasource type
│   └── tabs/
│       ├── ConnectionTab.tsx        # Connection configuration
│       ├── FieldsTab.tsx            # Field inference and selection
│       └── ColumnsTab.tsx           # Column definition editor
```

### Dependencies
```
agv3/src/
├── providers/
│   └── StompDatasourceProvider.ts   # STOMP client implementation
├── services/
│   ├── storage/
│   │   ├── storageClient.ts         # API client for persistence
│   │   └── types.ts                 # UnifiedConfig interface
│   └── template/
│       └── templateResolver.ts      # Variable substitution service
```

## Feature Breakdown

### 1. Connection Tab Features

#### Basic Configuration
- **Datasource Name** (required)
  - Text input for display name
  - Used for identification in sidebar

- **WebSocket URL** (required)
  - Full WebSocket connection URL
  - Example: `ws://localhost:8080`
  - Validated before connection test

#### Request Configuration
- **Data Type** (required)
  - Dropdown: "Positions" or "Trades"
  - Used to auto-generate topic paths
  - Default: "positions"

- **Message Rate** (required)
  - Number input with suffix "msg/s"
  - Range: 100-50,000 messages/second
  - Default: 1000
  - Used in auto-generated trigger topic

- **Batch Size** (optional)
  - Number input
  - Range: 10-1,000
  - Placeholder: "Auto (rate/10)"
  - Used in auto-generated trigger topic path

#### Topic Configuration Modes

**Mode 1: Auto-Generated Topics** (default)
- Automatically generates listener and trigger topics
- Pattern:
  ```
  Listener: /snapshot/{dataType}/[auto-generated-id]
  Trigger: /snapshot/{dataType}/[auto-generated-id]/{messageRate}/{batchSize}
  ```
- Shows preview of generated topics in info box
- New UUID generated on each connection

**Mode 2: Manual Topics** (checkbox to enable)
- User provides custom listener and trigger topics
- Supports template variables:
  - `[variable]` → replaced with `variable-UUID`
  - `{datasource.variable}` → replaced with datasource value
- Template variables info box with examples
- Session-consistent UUIDs during field inference

Examples:
```
Listener: /snapshot/positions/[client-id]
Trigger: /snapshot/positions/[client-id]/1000/50

With template resolution:
Listener: /snapshot/positions/client-id-f47ac10b-58cc-4372-a567-0e02b2c3d479
Trigger: /snapshot/positions/client-id-f47ac10b-58cc-4372-a567-0e02b2c3d479/1000/50
```

```
Using AppVariables:
Trigger: /snapshot/{AppVariables.ds.Environment}/[client-id]

Resolves to:
Trigger: /snapshot/production/client-id-UUID
```

#### Data Configuration
- **Snapshot End Token**
  - String token indicating end of snapshot
  - Default: "Success"
  - Used to detect when initial data load completes

- **Key Column**
  - Field name to use as unique key
  - Used for:
    - Duplicate elimination during snapshot
    - Row updates in realtime mode
  - Example: "id", "orderId", "symbol"

- **Snapshot Timeout**
  - Number input with suffix "ms"
  - Range: 10,000-600,000 milliseconds
  - Default: 30,000 (30 seconds)
  - Timeout for initial snapshot load

#### Options
- **Auto-start on application load**
  - Checkbox
  - Whether to automatically start provider when app loads

#### Actions
- **Test Connection**
  - Button with loading state
  - Tests WebSocket connection only (no topics needed)
  - Shows success/error status
  - Green checkmark on success
  - Red error message on failure

- **Update Datasource**
  - Primary action button
  - Saves configuration
  - Dispatches custom event for parent to handle
  - Available on all tabs

### 2. Fields Tab Features

#### Main Layout
Two-panel layout:
1. **Left Panel** - Field tree view with inference
2. **Right Panel** - Selected fields sidebar

#### Header Section
- **Select All Checkbox**
  - Three states: unchecked, checked, indeterminate
  - Selects/deselects all leaf fields
  - Shows indeterminate when partially selected

- **Field Count Badge**
  - Shows total inferred fields
  - Updates dynamically

- **Infer Fields Button**
  - Primary action to analyze live data
  - Shows loading spinner during inference
  - Connects to STOMP, fetches sample data
  - Analyzes up to 100 rows
  - Infers field types and structure

- **Clear All Button**
  - Removes all inferred fields
  - Resets selection

#### Search Functionality
- Search input with icon
- Filters fields by:
  - Field name
  - Full path (e.g., "order.instrument.symbol")
- Preserves tree structure
- Shows matched fields and their parents

#### Field Tree View
Sophisticated tree component with:

**Visual Features:**
- Tree lines connecting parent/child relationships
- Expand/collapse chevrons for parent nodes
- Color-coded type badges:
  - Green: string
  - Blue: number
  - Yellow: boolean
  - Purple: date
  - Orange: object
  - Pink: array
  - Gray: null

**Field Information Display:**
- Type badge (colored)
- Field name (bold for objects)
- Sample value (truncated with tooltip)
- Nullable indicator

**Selection Behavior:**
- **Leaf Fields**: Direct checkbox toggle
- **Object Fields**:
  - Shows indeterminate state when partially selected
  - Clicking toggles all non-object children
  - Object fields themselves aren't selectable (only leaves)

**Expand/Collapse:**
- Auto-expands all object fields on inference
- Manual expand/collapse per field
- Preserves expanded state during filtering

#### Selected Fields Sidebar
- Shows all selected field paths
- Sorted alphabetically
- Monospace font for readability
- Scroll area for many selections
- Badge showing count

#### Field Inference Process

**Step 1: Connect to STOMP**
```typescript
const provider = new StompDatasourceProvider({
  websocketUrl,
  listenerTopic,  // Resolved with templates
  requestMessage, // Resolved with templates
  requestBody: 'START',
  snapshotEndToken,
  keyColumn,
  messageRate,
  snapshotTimeoutMs
});
```

**Step 2: Fetch Sample Data**
```typescript
// Fetch up to 100 rows
const result = await provider.fetchSnapshot(100, (batch, total) => {
  // Handle duplicates if keyColumn specified
  if (keyColumn) {
    batch.forEach(row => {
      const key = row[keyColumn];
      dataMap.set(String(key), row);
    });
  }
});
```

**Step 3: Infer Field Schema**
```typescript
const fields = StompDatasourceProvider.inferFields(result.data);
```

**Inference Algorithm:**
- Analyzes all rows to determine field types
- Detects nested objects and arrays
- Tracks nullable fields
- Captures sample values
- Builds hierarchical structure

**Field Type Detection:**
- `string`: Text values
- `number`: Numeric values (int/float)
- `boolean`: true/false
- `date`: ISO date strings or timestamps
- `object`: Nested structures
- `array`: Array values
- `null`: Null values

### 3. Columns Tab Features

#### Main Layout
AG-Grid Enterprise table for column configuration

#### Add Manual Column Section
- **Field Name** input
- **Header Name** input
- **Type** dropdown (text, number, boolean, date, dateString, object)
- **Add** button (+ icon)
- **Clear All** button

#### Column Grid Features

**Columns:**
1. **Actions** (pinned left)
   - Trash icon button
   - Removes column
   - Works for both field-based and manual columns

2. **Field Name**
   - Non-editable for field-based columns
   - Shows full path (e.g., "order.instrument.symbol")
   - Filterable, sortable

3. **Type**
   - Dropdown editor: text, number, boolean, date, dateString, object
   - Changing type auto-updates formatter and renderer defaults
   - Filterable, sortable

4. **Header Name**
   - Editable text
   - Default: Auto-capitalized from field path
   - Example: "order.price" → "Order Price"
   - Filterable, sortable

5. **Value Formatter**
   - Dropdown editor
   - Options based on type:

**Number Formatters:**
```
- 0Decimal
- 1Decimal through 9Decimal
- 0DecimalWithThousandSeparator
- 1DecimalWithThousandSeparator through 9DecimalWithThousandSeparator
```

**Date Formatters:**
```
- ISODate (YYYY-MM-DD)
- ISODateTime (YYYY-MM-DD HH:mm:ss)
- ISODateTimeMillis (YYYY-MM-DD HH:mm:ss.SSS)
- USDate (MM/DD/YYYY)
- USDateTime (MM/DD/YYYY HH:mm:ss)
- USDateTime12Hour (MM/DD/YYYY hh:mm:ss AM/PM)
- EUDate (DD/MM/YYYY)
- EUDateTime (DD/MM/YYYY HH:mm:ss)
- LongDate (January 1, 2024)
- ShortDate (Jan 1, 2024)
- LongDateTime (January 1, 2024 12:30:45 PM)
- ShortDateTime (1/1/2024 12:30 PM)
- Time24Hour (14:30:45)
- Time12Hour (2:30:45 PM)
- TimeShort (2:30 PM)
- DateFromNow (2 hours ago)
- UnixTimestamp (seconds since epoch)
- UnixTimestampMillis (milliseconds since epoch)
```

6. **Cell Renderer**
   - Dropdown editor
   - Options based on type:
     - Number: `NumericCellRenderer` (right-aligned)
     - Others: Empty (default renderer)

#### Column Configuration Behavior

**Default Values by Type:**
- **Number Columns:**
  - Type: `numericColumn`
  - Filter: `agNumberColumnFilter`
  - Formatter: `2DecimalWithThousandSeparator`
  - Renderer: `NumericCellRenderer`

- **Date Columns:**
  - Filter: `agDateColumnFilter`
  - Formatter: `YYYY-MM-DD HH:mm:ss`

- **Text Columns:**
  - Default AG-Grid behavior

**Override System:**
- Field-based columns store overrides separately
- Manual columns store full definition
- Overrides only save changed properties
- Merges with defaults on save

#### Column Types

**Two Sources:**
1. **Field-Based Columns** (from Fields Tab)
   - Created from selected fields
   - Type inferred from field inference
   - Can override any property
   - Marked with `source: 'field'`

2. **Manual Columns** (added here)
   - User-defined fields
   - Not connected to inferred fields
   - Full control over definition
   - Marked with `source: 'manual'`

**Final Column List:**
- All field-based columns
- Plus all manual columns
- Shown in single grid
- Count shown in footer

#### AG-Grid Theme
Dark theme configuration matching AGV3 style:
```typescript
{
  accentColor: '#3a3a3a',
  backgroundColor: '#1a1a1a',
  borderColor: '#3a3a3a',
  foregroundColor: '#e5e7eb',
  headerBackgroundColor: '#2a2a2a',
  headerFontSize: 12,
  fontSize: 12,
  rowHeight: 36,
  headerHeight: 36
}
```

### 4. Save/Update Mechanism

#### Configuration Structure
```typescript
interface StompDatasourceConfig {
  id: string;                        // UUID
  name: string;                      // Display name
  websocketUrl: string;              // WS connection URL

  // Topic configuration
  dataType?: 'positions' | 'trades'; // For auto-generation
  messageRate?: number;              // For auto-generation
  batchSize?: number;                // For auto-generation
  manualTopics?: boolean;            // Manual vs auto mode
  listenerTopic: string;             // Actual or template
  requestMessage: string;            // Actual or template
  requestBody: string;               // Usually 'START'

  // Data configuration
  snapshotEndToken: string;
  keyColumn: string;
  snapshotTimeoutMs: number;
  autoStart: boolean;

  // Inferred schema
  inferredFields: FieldInfo[];

  // Column definitions
  columnDefinitions: ColumnDefinition[];
}
```

#### Save Process

**1. Validation:**
```typescript
if (!formData.name || !formData.websocketUrl) {
  // Show error toast
  return;
}
```

**2. Topic Resolution:**
```typescript
if (formData.manualTopics) {
  // Manual topics already set, just ensure requestBody
  if (!formData.requestBody) {
    formData.requestBody = 'START';
  }
} else {
  // Generate auto topics
  const clientId = uuidv4();
  const dataType = formData.dataType || 'positions';
  const messageRate = formData.messageRate || 1000;
  const batchSize = formData.batchSize || '';

  formData.listenerTopic = `/snapshot/${dataType}/${clientId}`;
  formData.requestMessage = `/snapshot/${dataType}/${clientId}/${messageRate}${batchSize ? `/${batchSize}` : ''}`;
  formData.requestBody = 'START';
}
```

**3. Build Column Definitions:**
```typescript
// From selected fields
const columnsFromFields = Array.from(selectedFields).map(path => {
  const override = fieldColumnOverrides[path] || {};
  const fieldNode = findFieldNode(inferredFields, path);
  const cellDataType = override.cellDataType ||
                       mapFieldTypeToCellType(fieldNode?.type);

  return {
    field: path,
    headerName: override.headerName || autoCapitalize(path),
    cellDataType,
    valueFormatter: override.valueFormatter || getDefault(cellDataType),
    cellRenderer: override.cellRenderer || getDefault(cellDataType),
    // ... other AG-Grid properties
  };
});

// Combine with manual columns
const allColumns = [...columnsFromFields, ...manualColumns];
```

**4. Update Config:**
```typescript
const updatedConfig = {
  ...formData,
  columnDefinitions: allColumns,
  inferredFields: inferredFields.map(convertToFieldInfo)
};
```

**5. Persist:**
```typescript
const unifiedConfig: UnifiedConfig = {
  configId: config.id || uuidv4(),
  appId: 'stern',
  userId: 'current-user',
  componentType: 'datasource',
  componentSubType: 'stomp',
  name: updatedConfig.name,
  description: '',
  config: updatedConfig,
  // ... metadata
};

await StorageClient.save(unifiedConfig);
```

**6. Notify:**
```typescript
// Custom event for parent component
const event = new CustomEvent('updateDatasource');
window.dispatchEvent(event);
```

### 5. Template Resolution Service

#### Variable Types

**Square Brackets: UUID Generation**
```
[variable] → variable-f47ac10b-58cc-4372-a567-0e02b2c3d479
```
- Each `[var]` gets a unique UUID
- Session-based caching for consistency
- Used for client IDs, request IDs

**Curly Brackets: Datasource Variables**
```
{AppVariables.ds.Environment} → production
{AppVariables.ds.ConnectionString} → ws://prod-server:8080
```
- Looks up value from AppVariables datasource
- Path format: `{datasourceName.variableName}`
- Falls back to original if not found

#### Resolution Process

**During Field Inference:**
```typescript
const sessionId = uuidv4();
listenerTopic = templateResolver.resolveTemplate(
  formData.listenerTopic,
  sessionId
);
requestMessage = templateResolver.resolveTemplate(
  formData.requestMessage,
  sessionId
);
```

**Session Consistency:**
- Same `sessionId` = same UUIDs for same variables
- Ensures listener and trigger topics match
- Critical for STOMP request/response pattern

**During Runtime:**
```typescript
// Provider resolves templates on each start
const resolvedListener = templateResolver.resolveTemplate(config.listenerTopic);
const resolvedTrigger = templateResolver.resolveTemplate(config.requestMessage);
```

#### Implementation
```typescript
class TemplateResolver {
  private uuidCache: Map<string, string>;

  resolveTemplate(template: string, sessionId?: string): string {
    // Resolve [variable] → variable-UUID
    template = this.resolveSquareBrackets(template, sessionId);

    // Resolve {datasource.variable} → value
    template = this.resolveCurlyBrackets(template);

    return template;
  }

  resolveSquareBrackets(template: string, sessionId?: string): string {
    return template.replace(/\[([^\]]+)\]/g, (_, variable) => {
      const cacheKey = sessionId ? `${sessionId}:${variable}` : variable;

      if (sessionId && this.uuidCache.has(cacheKey)) {
        return this.uuidCache.get(cacheKey)!;
      }

      const uuid = uuidv4();
      const resolved = `${variable}-${uuid}`;

      if (sessionId) {
        this.uuidCache.set(cacheKey, resolved);
      }

      return resolved;
    });
  }

  resolveCurlyBrackets(template: string): string {
    return template.replace(/\{([^}]+)\}/g, (match, path) => {
      const value = this.getVariableValue(path);
      return value !== undefined ? String(value) : match;
    });
  }
}
```

### 6. STOMP Provider Implementation

#### Key Features

**Connection Management:**
- Uses `@stomp/stompjs` library
- Configurable heartbeat intervals
- Automatic reconnection
- WebSocket fallback support

**Message Handling:**
```typescript
client.subscribe(listenerTopic, (message: IMessage) => {
  const data = JSON.parse(message.body);

  // Handle snapshot phase
  if (data.snapshotToken === snapshotEndToken) {
    this.statistics.mode = 'realtime';
    this.emit('snapshot-complete', this.snapshot);
  }

  // Process batch
  this.handleBatch(data.rows);
});
```

**Field Inference Algorithm:**
```typescript
static inferFields(rows: any[]): Record<string, FieldInfo> {
  const fields: Record<string, FieldInfo> = {};

  rows.forEach(row => {
    this.inferObject(row, '', fields);
  });

  return fields;
}

private static inferObject(
  obj: any,
  prefix: string,
  fields: Record<string, FieldInfo>
): void {
  Object.entries(obj).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (!fields[path]) {
      fields[path] = {
        path,
        type: this.inferType(value),
        nullable: false,
        sample: value
      };
    } else {
      // Update nullability
      if (value === null || value === undefined) {
        fields[path].nullable = true;
      }
    }

    // Recurse for objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (!fields[path].children) {
        fields[path].children = {};
      }
      this.inferObject(value, path, fields[path].children!);
    }
  });
}
```

**Type Inference:**
```typescript
private static inferType(value: any): FieldInfo['type'] {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'object') return 'object';

  // Check for date strings
  if (typeof value === 'string') {
    if (this.isDateString(value)) return 'date';
    return 'string';
  }

  return 'string';
}

private static isDateString(value: string): boolean {
  // ISO 8601 format
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return true;

  // Unix timestamp (milliseconds)
  if (/^\d{13}$/.test(value)) return true;

  // Other date formats...
  return false;
}
```

## Implementation Checklist for Stern

### Phase 1: Core Structure
- [ ] Create `DataProviderEditor` component (main container)
- [ ] Create 3-tab layout component
- [ ] Set up state management for configuration
- [ ] Implement sidebar for datasource list
- [ ] Add type selector dialog

### Phase 2: Connection Tab
- [ ] Basic configuration inputs
- [ ] Request configuration with data type
- [ ] Topic mode toggle (auto vs manual)
- [ ] Auto-generated topic preview
- [ ] Manual topic inputs with template info
- [ ] Data configuration inputs
- [ ] Options checkboxes
- [ ] Test connection functionality
- [ ] Status display (success/error)

### Phase 3: Fields Tab
- [ ] Create FieldsTab component
- [ ] Implement TreeItem component with:
  - [ ] Expand/collapse functionality
  - [ ] Checkbox with indeterminate state
  - [ ] Type badges with colors
  - [ ] Sample value display
  - [ ] Tree line connectors
- [ ] Field search functionality
- [ ] Select all checkbox (3 states)
- [ ] Selected fields sidebar
- [ ] Infer fields button and logic
- [ ] Integration with STOMP provider

### Phase 4: Columns Tab
- [ ] Create ColumnsTab component
- [ ] Set up AG-Grid Enterprise
- [ ] Add manual column section
- [ ] Configure grid columns:
  - [ ] Actions column with delete
  - [ ] Field name column
  - [ ] Type column with editor
  - [ ] Header name column (editable)
  - [ ] Value formatter column with conditional options
  - [ ] Cell renderer column with conditional options
- [ ] Implement cell value change handlers
- [ ] Handle field-based vs manual columns
- [ ] Apply dark theme
- [ ] Column count footer

### Phase 5: Data Management
- [ ] Implement save/update mechanism
- [ ] Topic resolution logic
- [ ] Column definition building
- [ ] Field info conversion
- [ ] Integration with configuration API

### Phase 6: STOMP Provider
- [ ] Port StompDatasourceProvider class
- [ ] Implement field inference algorithm
- [ ] Add type detection logic
- [ ] Handle nested objects
- [ ] Support snapshot/realtime modes
- [ ] Add statistics tracking

### Phase 7: Template Resolution
- [ ] Create TemplateResolver service
- [ ] Implement square bracket resolution
- [ ] Implement curly bracket resolution
- [ ] Add session-based UUID caching
- [ ] Integration with AppVariables

### Phase 8: Testing & Polish
- [ ] Test all field types
- [ ] Test nested objects
- [ ] Test template resolution
- [ ] Test connection failures
- [ ] Test field inference with various data
- [ ] Test column configuration
- [ ] Test save/load cycle
- [ ] Add comprehensive error handling
- [ ] Add loading states
- [ ] Add validation feedback

## Key Insights

### What Makes This Implementation Excellent

1. **Sophisticated Field Inference**
   - Handles nested objects recursively
   - Detects types accurately
   - Tracks nullability
   - Preserves samples

2. **Flexible Topic Configuration**
   - Auto-generation for simplicity
   - Manual configuration for power users
   - Template system for variables
   - Session consistency

3. **Professional Column Editor**
   - AG-Grid Enterprise for rich editing
   - Context-aware formatter options
   - Default values by type
   - Visual feedback

4. **Tree View Excellence**
   - Visual hierarchy with connectors
   - Color-coded types
   - Indeterminate checkboxes
   - Sample values inline

5. **Real-time Testing**
   - Test connection before save
   - Infer fields from live data
   - Immediate feedback
   - No guesswork

### Patterns to Follow

1. **State Management**
   - Local state for UI (expanded, selected)
   - Form data for configuration
   - Separate overrides from base values

2. **Component Composition**
   - Tabs for organization
   - Reusable TreeItem component
   - Shared interfaces

3. **User Experience**
   - Progressive disclosure (auto → manual)
   - Immediate feedback (badges, counts)
   - Visual hierarchy (colors, indent)
   - Helpful defaults

4. **Data Flow**
   - Infer → Select → Configure → Save
   - Clear state transitions
   - Validation at each step

## Next Steps

1. Start with Phase 1 (Core Structure)
2. Build Connection Tab first (most standalone)
3. Add STOMP provider for testing
4. Implement Fields Tab with tree view
5. Add Columns Tab with AG-Grid
6. Integrate all pieces
7. Thorough testing

## Estimated Effort

- **Phase 1-2**: 4-6 hours (structure + connection tab)
- **Phase 3**: 6-8 hours (fields tab with tree view)
- **Phase 4**: 4-6 hours (columns tab with AG-Grid)
- **Phase 5**: 2-3 hours (save/update logic)
- **Phase 6**: 6-8 hours (STOMP provider port)
- **Phase 7**: 2-3 hours (template resolver)
- **Phase 8**: 4-6 hours (testing & polish)

**Total**: 28-40 hours of development time

This is a substantial feature requiring careful attention to detail, but the result will be a professional-grade data provider configuration system.
