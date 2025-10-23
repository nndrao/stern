# Missing Features Analysis - STOMP Implementation vs AGV3 Spec

## Overview

After thorough analysis of [AGV3_STOMP_DATASOURCE_ANALYSIS.md](./AGV3_STOMP_DATASOURCE_ANALYSIS.md), the following features are **MISSING** from our current implementation:

---

## 🔴 **CRITICAL MISSING FEATURES**

### 1. **Fields Tab - Selected Fields Sidebar** (Lines 219-225)

**AGV3 Has:**
```
Right Panel showing:
- All selected field paths
- Sorted alphabetically
- Monospace font
- Scroll area for many selections
- Badge showing count
```

**Current Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- No right panel/sidebar in FieldsTab
- No visual list of selected fields
- No alphabetical sorting display
- Selected count is shown in tab badge only

**Impact:** Users can't see which fields are selected at a glance

---

### 2. **Columns Tab - AG-Grid Editor** (Lines 279-410)

**AGV3 Has:**
```
AG-Grid Enterprise table with:
- Inline cell editing
- Dropdown editors for Type, Formatter, Renderer
- Editable Header Name cells
- Delete action column
- Dark theme styling
- Row-level configuration
```

**Current Status:** ⚠️ **PARTIALLY IMPLEMENTED**

**What's Missing:**
- No AG-Grid integration (using Card components instead)
- No inline editing
- No dropdown cell editors
- No professional grid interface

**What Exists:**
- Card-based UI with dropdowns
- Basic configuration capabilities
- Field-based vs manual column separation

**Impact:** Less professional, harder to configure many columns

---

### 3. **Columns Tab - Add Manual Column Form** (Lines 282-288)

**AGV3 Has:**
```
Section with:
- Field Name input
- Header Name input
- Type dropdown (text, number, boolean, date, dateString, object)
- Add button (+ icon)
- Clear All button
```

**Current Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- No UI form to add manual columns
- No way to create columns not from inferred fields
- Can't add custom calculated fields

**Impact:** Can't add columns that don't exist in data

---

### 4. **Value Formatter Complete Options** (Lines 317-345)

**AGV3 Has:**
```
Number Formatters (19 options):
- 0Decimal through 9Decimal
- 0DecimalWithThousandSeparator through 9DecimalWithThousandSeparator

Date Formatters (18 options):
- ISODate, ISODateTime, ISODateTimeMillis
- USDate, USDateTime, USDateTime12Hour
- EUDate, EUDateTime
- LongDate, ShortDate
- LongDateTime, ShortDateTime
- Time24Hour, Time12Hour, TimeShort
- DateFromNow
- UnixTimestamp, UnixTimestampMillis
```

**Current Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- Placeholder options only
- No actual formatter options in dropdown
- No conditional options based on cell type

**Impact:** Can't format numbers/dates properly

---

### 5. **Cell Renderer Options** (Lines 347-351)

**AGV3 Has:**
```
Based on type:
- Number: NumericCellRenderer (right-aligned)
- Others: Empty (default renderer)
```

**Current Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- No renderer dropdown
- No NumericCellRenderer option
- No conditional rendering based on type

**Impact:** Numbers not right-aligned, no custom renderers

---

### 6. **Auto-Capitalize Header Names** (Lines 309-310)

**AGV3 Has:**
```typescript
autoCapitalize("order.price") → "Order Price"
autoCapitalize("user.firstName") → "User First Name"
```

**Current Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- Header names use field path as-is
- No automatic capitalization
- No space insertion for camelCase/dot notation

**Impact:** Poor default header names

---

### 7. **Duplicate Elimination with Key Column** (Lines 246-253)

**AGV3 Has:**
```typescript
// During snapshot fetch
if (keyColumn) {
  batch.forEach(row => {
    const key = row[keyColumn];
    dataMap.set(String(key), row);  // Deduplicates by key
  });
}
```

**Current Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- fetchSnapshot doesn't use keyColumn for deduplication
- Duplicate rows could be included in inference
- No Map-based deduplication

**Impact:** Inaccurate field inference with duplicate data

---

## 🟡 **MEDIUM PRIORITY MISSING FEATURES**

### 8. **Field Type Color-Coding** (Lines 192-199)

**AGV3 Has:**
```
Specific colors:
- Green: string
- Blue: number
- Yellow: boolean
- Purple: date
- Orange: object
- Pink: array
- Gray: null
```

**Current Status:** ⚠️ **PARTIALLY IMPLEMENTED**

**What Exists:**
- TreeItem.tsx has typeColorMap (Lines 22-51)
- Colors are defined

**What's Missing:**
- Need to verify exact color values match AGV3
- May need to adjust for consistency

**Impact:** Visual consistency

---

### 9. **Sample Value Display with Tooltip** (Lines 203-204)

**AGV3 Has:**
```typescript
<span
  className="truncate max-w-[200px]"
  title={String(field.sample)}  // Full value on hover
>
  {String(field.sample)}
</span>
```

**Current Status:** ⚠️ **CHECK NEEDED**

**What to Verify:**
- TreeItem shows sample values
- Need to confirm tooltip is present
- Verify truncation works correctly

---

### 10. **Field Search Preserves Tree Structure** (Lines 182-184)

**AGV3 Has:**
```
- Preserves tree structure
- Shows matched fields and their parents
- Hierarchical filtering
```

**Current Status:** ⚠️ **CHECK NEEDED**

**What to Verify:**
- filterFields function in FieldSelector.tsx
- Confirm it preserves parent structure
- Verify parents shown even if not matching

---

## 🟢 **LOW PRIORITY / NICE-TO-HAVE**

### 11. **Column Count Footer** (Line 394)

**AGV3 Has:**
```
Footer showing:
- Total column count
- Field-based vs manual breakdown
```

**Current Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- No footer in columns grid
- Count shown in header only

**Impact:** Minimal

---

### 12. **Custom Event Dispatch on Save** (Lines 523-528)

**AGV3 Has:**
```typescript
// Notify parent component
const event = new CustomEvent('updateDatasource');
window.dispatchEvent(event);
```

**Current Status:** ❌ **NOT IMPLEMENTED** (but not needed)

**What's Missing:**
- No custom event dispatch
- Uses React props/callbacks instead

**Impact:** None (React pattern is fine)

---

## 📊 **Implementation Priority**

### **HIGH PRIORITY** (Implement Now):

1. ✅ **Duplicate Elimination** - Critical for data accuracy
2. ✅ **Auto-Capitalize Headers** - Core UX feature
3. ✅ **Value Formatter Options** - Essential for column config
4. ✅ **Cell Renderer Options** - Needed for number formatting
5. ✅ **Add Manual Column Form** - Key functionality gap
6. ✅ **Selected Fields Sidebar** - Important visual feedback

### **MEDIUM PRIORITY** (Implement Soon):

7. ⚠️ **AG-Grid Column Editor** - Better UX but current UI works
8. ⚠️ **Verify Color-Coding** - Likely already correct
9. ⚠️ **Verify Sample Tooltips** - Likely already correct
10. ⚠️ **Verify Tree Search** - Likely already correct

### **LOW PRIORITY** (Optional):

11. ❌ **Column Count Footer** - Nice to have
12. ❌ **Custom Events** - Not needed with React

---

## 🔧 **Implementation Plan**

### Step 1: Fix STOMP Provider Deduplication

**File:** `client/src/services/providers/StompDatasourceProvider.ts`

```typescript
async fetchSnapshot(
  maxRows: number = 100,
  keyColumn?: string,  // Add parameter
  onBatch?: (batch: any[], totalRows: number) => void
): Promise<StompConnectionResult> {
  const receivedData: any[] = [];
  const dataMap = new Map<string, any>();  // For deduplication

  // In message handler:
  const rows = data.rows || data.data || [data];

  if (keyColumn) {
    // Deduplicate by key
    rows.forEach(row => {
      const key = row[keyColumn];
      if (key !== undefined && key !== null) {
        dataMap.set(String(key), row);
      }
    });

    // Update receivedData from Map
    receivedData.length = 0;
    receivedData.push(...dataMap.values());
  } else {
    // No deduplication
    receivedData.push(...rows);
  }

  if (onBatch) {
    onBatch(rows, receivedData.length);
  }
}
```

### Step 2: Add Auto-Capitalize Utility

**File:** `client/src/utils/stringUtils.ts` (new file)

```typescript
/**
 * Auto-capitalize field path for header names
 *
 * Examples:
 * - "order.price" → "Order Price"
 * - "user.firstName" → "User First Name"
 * - "id" → "Id"
 */
export function autoCapitalize(fieldPath: string): string {
  return fieldPath
    .split('.')
    .map(part => {
      // Handle camelCase: firstName → First Name
      const withSpaces = part.replace(/([A-Z])/g, ' $1');
      // Capitalize first letter
      return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
    })
    .join(' ')
    .trim();
}
```

### Step 3: Add Value Formatter Options

**File:** `client/src/constants/columnFormatters.ts` (new file)

```typescript
export const NUMBER_FORMATTERS = [
  { value: '0Decimal', label: '0 Decimal' },
  { value: '1Decimal', label: '1 Decimal' },
  { value: '2Decimal', label: '2 Decimals' },
  { value: '3Decimal', label: '3 Decimals' },
  { value: '4Decimal', label: '4 Decimals' },
  { value: '5Decimal', label: '5 Decimals' },
  { value: '6Decimal', label: '6 Decimals' },
  { value: '7Decimal', label: '7 Decimals' },
  { value: '8Decimal', label: '8 Decimals' },
  { value: '9Decimal', label: '9 Decimals' },
  { value: '0DecimalWithThousandSeparator', label: '0 Decimal (1,000)' },
  { value: '1DecimalWithThousandSeparator', label: '1 Decimal (1,000.0)' },
  { value: '2DecimalWithThousandSeparator', label: '2 Decimals (1,000.00)' },
  { value: '3DecimalWithThousandSeparator', label: '3 Decimals (1,000.000)' },
  { value: '4DecimalWithThousandSeparator', label: '4 Decimals (1,000.0000)' },
  { value: '5DecimalWithThousandSeparator', label: '5 Decimals' },
  { value: '6DecimalWithThousandSeparator', label: '6 Decimals' },
  { value: '7DecimalWithThousandSeparator', label: '7 Decimals' },
  { value: '8DecimalWithThousandSeparator', label: '8 Decimals' },
  { value: '9DecimalWithThousandSeparator', label: '9 Decimals' },
];

export const DATE_FORMATTERS = [
  { value: 'ISODate', label: 'ISO Date (YYYY-MM-DD)' },
  { value: 'ISODateTime', label: 'ISO DateTime (YYYY-MM-DD HH:mm:ss)' },
  { value: 'ISODateTimeMillis', label: 'ISO DateTime Millis' },
  { value: 'USDate', label: 'US Date (MM/DD/YYYY)' },
  { value: 'USDateTime', label: 'US DateTime (MM/DD/YYYY HH:mm:ss)' },
  { value: 'USDateTime12Hour', label: 'US DateTime 12H' },
  { value: 'EUDate', label: 'EU Date (DD/MM/YYYY)' },
  { value: 'EUDateTime', label: 'EU DateTime (DD/MM/YYYY HH:mm:ss)' },
  { value: 'LongDate', label: 'Long Date (January 1, 2024)' },
  { value: 'ShortDate', label: 'Short Date (Jan 1, 2024)' },
  { value: 'LongDateTime', label: 'Long DateTime' },
  { value: 'ShortDateTime', label: 'Short DateTime (1/1/2024 12:30 PM)' },
  { value: 'Time24Hour', label: '24-Hour Time (14:30:45)' },
  { value: 'Time12Hour', label: '12-Hour Time (2:30:45 PM)' },
  { value: 'TimeShort', label: 'Time Short (2:30 PM)' },
  { value: 'DateFromNow', label: 'Relative (2 hours ago)' },
  { value: 'UnixTimestamp', label: 'Unix Timestamp (seconds)' },
  { value: 'UnixTimestampMillis', label: 'Unix Timestamp (milliseconds)' },
];

export const CELL_RENDERERS = [
  { value: '', label: 'Default' },
  { value: 'NumericCellRenderer', label: 'Numeric (right-aligned)' },
];
```

### Step 4: Add Manual Column Form to ColumnsTab

```tsx
// Add to ColumnsTab.tsx
const [newColumnField, setNewColumnField] = useState('');
const [newColumnHeader, setNewColumnHeader] = useState('');
const [newColumnType, setNewColumnType] = useState<ColumnDefinition['cellDataType']>('text');

const handleAddManualColumn = () => {
  if (!newColumnField || !newColumnHeader) return;

  const newColumn: ColumnDefinition = {
    field: newColumnField,
    headerName: newColumnHeader,
    cellDataType: newColumnType,
    valueFormatter: getDefaultFormatter(newColumnType),
    cellRenderer: getDefaultRenderer(newColumnType),
  };

  onManualColumnsChange([...manualColumns, newColumn]);

  // Reset form
  setNewColumnField('');
  setNewColumnHeader('');
  setNewColumnType('text');
};

// UI:
<Card>
  <CardHeader>
    <CardTitle className="text-sm">Add Manual Column</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <div className="grid grid-cols-3 gap-3">
      <div>
        <Label>Field Name</Label>
        <Input
          value={newColumnField}
          onChange={(e) => setNewColumnField(e.target.value)}
          placeholder="customField"
        />
      </div>
      <div>
        <Label>Header Name</Label>
        <Input
          value={newColumnHeader}
          onChange={(e) => setNewColumnHeader(e.target.value)}
          placeholder="Custom Field"
        />
      </div>
      <div>
        <Label>Type</Label>
        <Select value={newColumnType} onValueChange={(v) => setNewColumnType(v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="dateString">Date String</SelectItem>
            <SelectItem value="object">Object</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <Button onClick={handleAddManualColumn} size="sm" className="w-full">
      <Plus className="w-4 h-4 mr-2" />
      Add Column
    </Button>
  </CardContent>
</Card>
```

### Step 5: Add Selected Fields Sidebar to FieldsTab

```tsx
// Add to FieldsTab.tsx
<div className="grid grid-cols-[1fr,300px] gap-4 flex-1 overflow-hidden">
  {/* Left: Tree View (existing) */}
  <ScrollArea className="h-full border rounded-md">
    {/* ... existing tree ... */}
  </ScrollArea>

  {/* Right: Selected Fields Sidebar */}
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        Selected Fields
        <Badge variant="secondary">{selectedFields.size}</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-[400px]">
        <div className="space-y-1">
          {Array.from(selectedFields)
            .sort()
            .map(path => (
              <div
                key={path}
                className="text-xs font-mono px-2 py-1 rounded hover:bg-accent"
              >
                {path}
              </div>
            ))}
          {selectedFields.size === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No fields selected
            </p>
          )}
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
</div>
```

---

## ✅ **Summary**

**Currently Implemented:** ~60% of AGV3 features
**Missing Critical Features:** 7
**Missing Medium Features:** 3
**Missing Low Priority:** 2

**Total Missing:** 12 features

**Estimated Time to Complete:**
- Critical features: 4-6 hours
- Medium features: 2-3 hours
- Low priority: 1 hour

**Total:** 7-10 hours additional work

The implementation is functional but missing several key features that make AGV3 professional and complete.
