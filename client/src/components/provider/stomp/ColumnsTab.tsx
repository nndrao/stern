/**
 * Columns Tab Component - AG-Grid Edition
 * Configure column definitions with in-grid editing (AGV3 pattern)
 */

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModuleRegistry, ColDef, GridApi, GridReadyEvent, CellValueChangedEvent } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { Plus, Trash2 } from 'lucide-react';
import { FieldNode } from './FieldSelector';
import { ColumnDefinition } from '@stern/shared-types';
import { sternAgGridTheme } from '@/utils/grid/agGridTheme';
import { useAgGridTheme } from '@/hooks/ui/useAgGridTheme';

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
  onClearAll: () => void;
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
}: ColumnsTabProps) {
  const [newColumn, setNewColumn] = useState({ field: '', header: '', type: 'text' as ColumnDefinition['cellDataType'] });
  const [, setGridApi] = useState<GridApi | null>(null);

  // Sync AG Grid theme with application theme
  useAgGridTheme();

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
      width: 40,
      pinned: 'left',
      cellRenderer: (params: any) => {
        return (
          <button
            className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              if (params.data.source === 'field') {
                // For field-based columns, we remove from selected fields
                // This is handled externally via selectedFields state
                // Here we just handle the UI action (no-op)
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
      headerName: 'Field',
      width: 180,
      sortable: true,
      filter: true,
    },
    {
      field: 'cellDataType',
      headerName: 'Type',
      width: 100,
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
      headerName: 'Header',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      editable: true,
    },
    {
      field: 'valueFormatter',
      headerName: 'Formatter',
      width: 200,
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
      headerName: 'Renderer',
      width: 140,
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
      {/* Compact Add Manual Column Section */}
      <div className="px-3 py-2 border-b border-border flex-shrink-0 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Add Manual Column</span>
          <Input
            value={newColumn.field}
            onChange={(e) => setNewColumn({ ...newColumn, field: e.target.value })}
            placeholder="Field"
            className="h-7 text-xs bg-background border-border"
          />
          <Input
            value={newColumn.header}
            onChange={(e) => setNewColumn({ ...newColumn, header: e.target.value })}
            placeholder="Header"
            className="h-7 text-xs bg-background border-border"
          />
          <select
            value={newColumn.type}
            onChange={(e) => setNewColumn({ ...newColumn, type: e.target.value as ColumnDefinition['cellDataType'] })}
            className="h-7 px-2 border border-border bg-background text-foreground rounded-md text-xs focus:border-primary focus:ring-1 focus:ring-primary"
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
            className="h-7 w-7 p-0"
            title="Add column"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearAll}
            disabled={columns.length === 0}
            className="h-7 px-2 text-xs"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* AG-Grid */}
      <div className="flex-1 overflow-hidden bg-background">
        <AgGridReact
          theme={sternAgGridTheme}
          rowData={columns}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          animateRows={true}
          headerHeight={32}
          rowHeight={32}
          suppressMovableColumns={true}
          suppressCellFocus={true}
          suppressRowHoverHighlight={false}
          rowSelection="single"
          domLayout="normal"
        />
      </div>
    </div>
  );
}
