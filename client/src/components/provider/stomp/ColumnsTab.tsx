/**
 * Columns Tab Component - AG-Grid Edition
 * Configure column definitions with in-grid editing (AGV3 pattern)
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModuleRegistry, themeQuartz, ColDef, GridApi, GridReadyEvent, CellValueChangedEvent } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { Plus, Trash2 } from 'lucide-react';
import { FieldNode } from './FieldSelector';
import { ColumnDefinition } from '@stern/shared-types';

// Register AG-Grid modules
ModuleRegistry.registerModules([AllEnterpriseModule]);

// Helper functions to get formatter/renderer options by type
const getValueFormatterOptions = (cellDataType?: string): string[] => {
  if (!cellDataType) return [];

  switch (cellDataType) {
    case 'number':
      return [
        '',
        '0Decimal',
        '1Decimal',
        '2Decimal',
        '3Decimal',
        '4Decimal',
        '5Decimal',
        '6Decimal',
        '7Decimal',
        '8Decimal',
        '9Decimal',
        '0DecimalWithThousandSeparator',
        '1DecimalWithThousandSeparator',
        '2DecimalWithThousandSeparator',
        '3DecimalWithThousandSeparator',
        '4DecimalWithThousandSeparator',
        '5DecimalWithThousandSeparator',
        '6DecimalWithThousandSeparator',
        '7DecimalWithThousandSeparator',
        '8DecimalWithThousandSeparator',
        '9DecimalWithThousandSeparator',
      ];
    case 'date':
    case 'dateString':
      return [
        '',
        'ISODate',
        'ISODateTime',
        'ISODateTimeMillis',
        'USDate',
        'USDateTime',
        'USDateTime12Hour',
        'EUDate',
        'EUDateTime',
        'LongDate',
        'ShortDate',
        'LongDateTime',
        'ShortDateTime',
        'Time24Hour',
        'Time12Hour',
        'TimeShort',
        'DateFromNow',
        'UnixTimestamp',
        'UnixTimestampMillis',
        'YYYY-MM-DD HH:mm:ss',
      ];
    default:
      return [''];
  }
};

const getCellRendererOptions = (cellDataType?: string): string[] => {
  if (!cellDataType) return [''];

  switch (cellDataType) {
    case 'number':
      return ['', 'NumericCellRenderer'];
    default:
      return [''];
  }
};

interface ColumnsTabProps {
  name: string;
  selectedFields: Set<string>;
  inferredFields: FieldNode[];
  manualColumns: ColumnDefinition[];
  fieldColumnOverrides: Record<string, Partial<ColumnDefinition>>;
  onManualColumnsChange: (columns: ColumnDefinition[]) => void;
  onFieldColumnOverridesChange: (overrides: Record<string, Partial<ColumnDefinition>>) => void;
  onSave: () => void;
  onCancel: () => void;
  onClearAll: () => void;
  isEditMode?: boolean;
}

export function ColumnsTab({
  name,
  selectedFields,
  inferredFields,
  manualColumns,
  fieldColumnOverrides,
  onManualColumnsChange,
  onFieldColumnOverridesChange,
  onClearAll,
  onSave,
  onCancel,
  isEditMode = false
}: ColumnsTabProps) {
  const [newColumn, setNewColumn] = useState({ field: '', header: '', type: 'text' as ColumnDefinition['cellDataType'] });
  const [, setGridApi] = useState<GridApi | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const [, setThemeKey] = useState(0); // Force re-render on theme change

  // Get field type from inferred fields
  const getFieldType = (path: string): string | undefined => {
    const findField = (fields: FieldNode[]): FieldNode | undefined => {
      for (const field of fields) {
        if (field.path === path) return field;
        if (field.children) {
          const found = findField(field.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    const field = findField(inferredFields);
    return field?.type;
  };

  // Get all columns (field-based + manual)
  const getAllColumns = useCallback(() => {
    const columns: any[] = [];

    // Add field-based columns
    Array.from(selectedFields).forEach(path => {
      const override = fieldColumnOverrides[path] || {};
      const fieldType = getFieldType(path);
      const cellDataType = override.cellDataType || (fieldType === 'number' ? 'number' :
                                                    fieldType === 'boolean' ? 'boolean' :
                                                    fieldType === 'date' ? 'date' : 'text');

      // Set defaults for numeric columns
      const valueFormatter = override.valueFormatter !== undefined ? override.valueFormatter :
                           (cellDataType === 'number' ? '2DecimalWithThousandSeparator' :
                            cellDataType === 'date' || cellDataType === 'dateString' ? 'YYYY-MM-DD HH:mm:ss' : '');
      const cellRenderer = override.cellRenderer !== undefined ? override.cellRenderer :
                         (cellDataType === 'number' ? 'NumericCellRenderer' : '');

      columns.push({
        field: path,
        headerName: override.headerName || path.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
        cellDataType: cellDataType,
        valueFormatter: valueFormatter,
        cellRenderer: cellRenderer,
        source: 'field',
      });
    });

    // Add manual columns
    manualColumns.forEach(col => {
      // Set defaults for numeric columns
      const valueFormatter = col.valueFormatter !== undefined ? col.valueFormatter :
                           (col.cellDataType === 'number' ? '2DecimalWithThousandSeparator' :
                            col.cellDataType === 'date' || col.cellDataType === 'dateString' ? 'YYYY-MM-DD HH:mm:ss' : '');
      const cellRenderer = col.cellRenderer !== undefined ? col.cellRenderer :
                         (col.cellDataType === 'number' ? 'NumericCellRenderer' : '');

      columns.push({
        ...col,
        valueFormatter: valueFormatter,
        cellRenderer: cellRenderer,
        source: 'manual',
      });
    });

    return columns;
  }, [selectedFields, manualColumns, fieldColumnOverrides, inferredFields]);

  // Column definitions for AG-Grid
  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'actions',
      headerName: '',
      width: 50,
      pinned: 'left',
      cellRenderer: (params: any) => {
        return (
          <button
            className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              if (params.data.source === 'field') {
                // For field-based columns, we remove from selected fields
                // This is handled externally via selectedFields state
                // Here we just handle the UI action
                console.log('[ColumnsTab] Cannot delete field-based column from this view');
              } else {
                onManualColumnsChange(manualColumns.filter(col => col.field !== params.data.field));
              }
            }}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        );
      },
    },
    {
      field: 'field',
      headerName: 'Field Name',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
    },
    {
      field: 'cellDataType',
      headerName: 'Type',
      width: 120,
      sortable: true,
      filter: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['text', 'number', 'boolean', 'date', 'dateString', 'object'],
      },
      editable: true,
    },
    {
      field: 'headerName',
      headerName: 'Header Name',
      flex: 1,
      minWidth: 200,
      sortable: true,
      filter: true,
      editable: true,
    },
    {
      field: 'valueFormatter',
      headerName: 'Value Formatter',
      width: 180,
      sortable: true,
      filter: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: (params: any) => {
        const cellDataType = params.data?.cellDataType;
        return {
          values: getValueFormatterOptions(cellDataType),
        };
      },
      editable: true,
    },
    {
      field: 'cellRenderer',
      headerName: 'Cell Renderer',
      width: 160,
      sortable: true,
      filter: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: (params: any) => {
        const cellDataType = params.data?.cellDataType;
        return {
          values: getCellRendererOptions(cellDataType),
        };
      },
      editable: true,
    },
  ], [manualColumns, onManualColumnsChange]);

  // Force grid to update when theme changes
  useEffect(() => {
    setThemeKey(prev => prev + 1);
  }, [theme, resolvedTheme]);

  // Grid theme configuration - dynamically read from CSS variables
  const gridTheme = useMemo(() => {
    // Read CSS custom properties to match the current theme
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);

    // Helper to get HSL color and convert to hex
    const getHslColor = (variable: string, fallback: string) => {
      const hsl = computedStyle.getPropertyValue(variable).trim();
      if (!hsl) return fallback;

      // Convert HSL to hex (simple approximation for theme colors)
      const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));

      // For grayscale (s=0), just use lightness
      const lightness = l / 100;
      const value = Math.round(lightness * 255);
      const hex = value.toString(16).padStart(2, '0');
      return `#${hex}${hex}${hex}`;
    };

    return themeQuartz.withParams({
      accentColor: getHslColor('--accent', '#3a3a3a'),
      backgroundColor: getHslColor('--background', '#1a1a1a'),
      borderColor: getHslColor('--border', '#3a3a3a'),
      foregroundColor: getHslColor('--foreground', '#e5e7eb'),
      headerBackgroundColor: getHslColor('--muted', '#2a2a2a'),
      headerFontSize: 12,
      fontSize: 12,
      rowHeight: 36,
      headerHeight: 36,
      cellHorizontalPadding: 8,
    });
  }, [theme, resolvedTheme]);

  // Handle grid ready
  const onGridReady = useCallback((event: GridReadyEvent) => {
    setGridApi(event.api);
  }, []);

  // Handle cell value changed
  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { data, colDef, newValue } = event;

    if (data.source === 'manual') {
      const index = manualColumns.findIndex(col => col.field === data.field);
      if (index !== -1) {
        const updated = [...manualColumns];
        if (colDef?.field === 'cellDataType') {
          // When type changes, set appropriate defaults
          updated[index] = {
            ...updated[index],
            cellDataType: newValue,
            valueFormatter: newValue === 'number' ? '2DecimalWithThousandSeparator' :
                          (newValue === 'date' || newValue === 'dateString' ? 'YYYY-MM-DD HH:mm:ss' : ''),
            cellRenderer: newValue === 'number' ? 'NumericCellRenderer' : undefined,
          };
        } else if (colDef?.field === 'headerName') {
          updated[index] = { ...updated[index], headerName: newValue };
        } else if (colDef?.field === 'valueFormatter') {
          updated[index] = { ...updated[index], valueFormatter: newValue };
        } else if (colDef?.field === 'cellRenderer') {
          updated[index] = { ...updated[index], cellRenderer: newValue };
        }
        onManualColumnsChange(updated);
      }
    } else if (data.source === 'field') {
      // Handle field-based columns
      if (colDef?.field === 'cellDataType') {
        // When type changes, set appropriate defaults
        onFieldColumnOverridesChange({
          ...fieldColumnOverrides,
          [data.field]: {
            ...fieldColumnOverrides[data.field],
            cellDataType: newValue,
            valueFormatter: newValue === 'number' ? '2DecimalWithThousandSeparator' :
                          (newValue === 'date' || newValue === 'dateString' ? 'YYYY-MM-DD HH:mm:ss' : ''),
            cellRenderer: newValue === 'number' ? 'NumericCellRenderer' : undefined,
          },
        });
      } else {
        onFieldColumnOverridesChange({
          ...fieldColumnOverrides,
          [data.field]: {
            ...fieldColumnOverrides[data.field],
            [colDef?.field as string]: newValue,
          },
        });
      }
    }
  }, [manualColumns, fieldColumnOverrides, onManualColumnsChange, onFieldColumnOverridesChange]);

  const handleAddColumn = () => {
    if (!newColumn.field || !newColumn.header) {
      return;
    }

    const column: ColumnDefinition = {
      field: newColumn.field,
      headerName: newColumn.header,
      cellDataType: newColumn.type,
      valueFormatter: newColumn.type === 'number' ? '2DecimalWithThousandSeparator' :
                     (newColumn.type === 'date' || newColumn.type === 'dateString' ? 'YYYY-MM-DD HH:mm:ss' : ''),
      cellRenderer: newColumn.type === 'number' ? 'NumericCellRenderer' : undefined,
    };

    onManualColumnsChange([...manualColumns, column]);
    setNewColumn({ field: '', header: '', type: 'text' });
  };

  const columns = getAllColumns();

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Add Manual Column Section */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">Add Manual Column</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearAll}
            disabled={columns.length === 0}
            className="text-foreground hover:bg-muted hover:text-foreground"
          >
            Clear All
          </Button>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              value={newColumn.field}
              onChange={(e) => setNewColumn({ ...newColumn, field: e.target.value })}
              placeholder="Field name"
              className="h-9 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <Input
              value={newColumn.header}
              onChange={(e) => setNewColumn({ ...newColumn, header: e.target.value })}
              placeholder="Header name"
              className="h-9 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={newColumn.type}
            onChange={(e) => setNewColumn({ ...newColumn, type: e.target.value as ColumnDefinition['cellDataType'] })}
            className="h-9 px-3 border border-border bg-muted text-foreground rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="date">Date</option>
            <option value="dateString">Date String</option>
            <option value="object">Object</option>
          </select>
          <Button
            size="sm"
            onClick={handleAddColumn}
            disabled={!newColumn.field || !newColumn.header}
            className="h-9 px-3 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* AG-Grid */}
      <div className="flex-1 overflow-hidden bg-background">
        <AgGridReact
          theme={gridTheme}
          className="ag-theme-quartz-dark"
          rowData={columns}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          animateRows={true}
          headerHeight={36}
          rowHeight={36}
          suppressMovableColumns={true}
          suppressCellFocus={true}
          suppressRowHoverHighlight={false}
          rowSelection="single"
          domLayout="normal"
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between flex-shrink-0">
        <div className="text-sm text-muted-foreground">
          {columns.length} columns total
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-foreground hover:bg-muted hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={onSave}
          >
            {isEditMode ? 'Update Datasource' : 'Create Datasource'}
          </Button>
        </div>
      </div>
    </div>
  );
}
