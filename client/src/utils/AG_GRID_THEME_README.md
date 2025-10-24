# AG Grid Theme Implementation Guide

This document explains how to use the generic AG Grid theme implementation in the Stern platform.

## Quick Start

For any component that uses AG Grid, follow these 3 simple steps:

### 1. Import the Theme and Hook

```typescript
import { sternAgGridTheme } from '@/utils/agGridTheme';
import { useAgGridTheme } from '@/hooks/useAgGridTheme';
import { AgGridReact } from 'ag-grid-react';
```

### 2. Use the Hook in Your Component

```typescript
export function MyComponent() {
  // Sync AG Grid theme with application theme
  useAgGridTheme();

  // ... rest of your component
}
```

### 3. Apply the Theme to AgGridReact

```typescript
<AgGridReact
  theme={sternAgGridTheme}
  // ... other props
/>
```

## Complete Example

```typescript
import { useState, useCallback } from 'react';
import { ModuleRegistry, ColDef, GridReadyEvent } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { sternAgGridTheme } from '@/utils/agGridTheme';
import { useAgGridTheme } from '@/hooks/useAgGridTheme';

// Register AG-Grid modules (do this once per component)
ModuleRegistry.registerModules([AllEnterpriseModule]);

interface MyData {
  id: string;
  name: string;
  value: number;
}

export function MyDataGrid() {
  // Sync AG Grid theme with application theme
  useAgGridTheme();

  const [rowData] = useState<MyData[]>([
    { id: '1', name: 'Item 1', value: 100 },
    { id: '2', name: 'Item 2', value: 200 },
  ]);

  const columnDefs: ColDef<MyData>[] = [
    { field: 'id', headerName: 'ID' },
    { field: 'name', headerName: 'Name' },
    { field: 'value', headerName: 'Value' },
  ];

  const onGridReady = useCallback((event: GridReadyEvent) => {
    // Grid is ready
    console.log('Grid ready', event.api);
  }, []);

  return (
    <div className="h-full">
      <AgGridReact
        theme={sternAgGridTheme}
        rowData={rowData}
        columnDefs={columnDefs}
        onGridReady={onGridReady}
      />
    </div>
  );
}
```

## How It Works

### Theme Definition

The `sternAgGridTheme` in `@/utils/agGridTheme.ts` is configured with both light and dark mode parameters:

- **Light Mode**: Clean, bright colors for daytime use
- **Dark Mode**: Dark background with high contrast for reduced eye strain

The theme is built using AG Grid's `themeQuartz.withParams()` API, which allows defining different parameter sets for each color scheme.

### Automatic Theme Switching

The `useAgGridTheme()` hook:
1. Listens to the application theme changes via `useTheme()` from `next-themes`
2. Sets `document.body.dataset.agThemeMode` to either "dark" or "light"
3. AG Grid automatically switches between the configured light/dark params based on this attribute

### Benefits

1. **Consistent**: All AG Grids in the app use the same theme
2. **Automatic**: Theme switches when user toggles dark/light mode
3. **Simple**: Only 3 lines of code needed per component
4. **Maintainable**: Change theme in one place, applies everywhere

## Customization

If you need to customize the theme for a specific grid:

```typescript
import { sternAgGridTheme } from '@/utils/agGridTheme';

// Extend the base theme
const customTheme = sternAgGridTheme.withParams({
  rowHeight: 48, // Larger rows
  fontSize: 14,  // Bigger font
});

<AgGridReact theme={customTheme} />
```

## Troubleshooting

### Theme Not Switching

If the theme doesn't switch when you toggle dark/light mode:

1. Make sure you're calling `useAgGridTheme()` in your component
2. Check that you're using `sternAgGridTheme` (not a custom theme)
3. Verify `next-themes` is properly configured in your app

### Colors Look Wrong

The theme is configured to match the Stern platform design. If colors look wrong:

1. Check if you're overriding theme colors with custom CSS
2. Verify the theme params in `@/utils/agGridTheme.ts`
3. Make sure you're not setting `className="ag-theme-*"` on AgGridReact

## Reference

Based on the AGV3 implementation pattern. See:
- `C:\Users\andyrao\Documents\projects\agv3\ref.md` for original implementation
- `client/src/components/provider/stomp/ColumnsTab.tsx` for example usage
