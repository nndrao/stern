/**
 * DataGrid Component
 *
 * AG-Grid Enterprise wrapper with:
 * - Conditional formatting
 * - Column state management
 * - Row grouping
 * - Live data updates
 * - Configuration persistence
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { LicenseManager } from 'ag-grid-enterprise';
import type {
  ColDef,
  GridOptions,
  GridReadyEvent,
  ColumnState,
  CellClassParams,
  ValueFormatterParams,
  RowDataUpdatedEvent
} from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import { logger } from '@/utils/logger';

// Set AG-Grid license (if available)
// TODO: Add license key to environment variables
// LicenseManager.setLicenseKey('YOUR_LICENSE_KEY');

// Conditional formatting rule interface
export interface ConditionalFormattingRule {
  id: string;
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains';
  value: string | number;
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
}

// Column group interface
export interface ColumnGroup {
  groupId: string;
  headerName: string;
  children: string[];
  marryChildren?: boolean;
}

// Grid configuration interface
export interface DataGridConfig {
  columns?: ColDef[];
  columnState?: ColumnState[];
  columnGroups?: ColumnGroup[];
  conditionalFormatting?: ConditionalFormattingRule[];
  gridOptions?: Partial<GridOptions>;
  rowGroupCols?: string[];
  pivotCols?: string[];
  valueCols?: string[];
}

export interface DataGridProps {
  config?: DataGridConfig;
  rowData?: any[];
  onConfigChange?: (config: Partial<DataGridConfig>) => void;
  onRowClicked?: (row: any) => void;
  className?: string;
}

/**
 * Apply conditional formatting rules to a cell
 */
function applyCellStyle(
  params: CellClassParams,
  rules: ConditionalFormattingRule[] = []
): Record<string, any> {
  const { colDef, value } = params;
  const field = colDef.field;

  if (!field) return {};

  // Find matching rules for this field
  const matchingRules = rules.filter(rule => rule.field === field);

  for (const rule of matchingRules) {
    let matches = false;

    switch (rule.operator) {
      case 'equals':
        matches = value == rule.value; // Loose equality for type flexibility
        break;
      case 'notEquals':
        matches = value != rule.value;
        break;
      case 'greaterThan':
        matches = Number(value) > Number(rule.value);
        break;
      case 'lessThan':
        matches = Number(value) < Number(rule.value);
        break;
      case 'contains':
        matches = String(value).includes(String(rule.value));
        break;
    }

    if (matches) {
      return {
        backgroundColor: rule.backgroundColor,
        color: rule.textColor,
        fontWeight: rule.fontWeight
      };
    }
  }

  return {};
}

export const DataGrid: React.FC<DataGridProps> = ({
  config,
  rowData = [],
  onConfigChange,
  onRowClicked,
  className = ''
}) => {
  const gridRef = useRef<AgGridReact>(null);

  // Default columns if not provided
  const defaultColumns: ColDef[] = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 100, hide: true },
    { field: 'symbol', headerName: 'Symbol', width: 120, filter: true, sortable: true },
    { field: 'quantity', headerName: 'Quantity', width: 120, filter: true, sortable: true, type: 'numericColumn' },
    { field: 'price', headerName: 'Price', width: 120, filter: true, sortable: true, type: 'numericColumn' },
    { field: 'value', headerName: 'Value', width: 140, filter: true, sortable: true, type: 'numericColumn' },
    { field: 'side', headerName: 'Side', width: 100, filter: true, sortable: true },
  ], []);

  // Merge default columns with config columns
  const columnDefs = useMemo(() => {
    const columns = config?.columns || defaultColumns;

    // Add conditional formatting cell style to each column
    return columns.map(col => ({
      ...col,
      cellStyle: (params: CellClassParams) => {
        return applyCellStyle(params, config?.conditionalFormatting);
      }
    }));
  }, [config?.columns, config?.conditionalFormatting, defaultColumns]);

  // Grid options
  const gridOptions: GridOptions = useMemo(() => ({
    // Merge user config with defaults
    ...config?.gridOptions,

    // Core features
    animateRows: true,
    enableRangeSelection: true,
    enableCharts: true,
    rowSelection: 'multiple',

    // Column features
    enableColResize: true,
    enableSorting: true,
    enableFilter: true,

    // Row grouping
    groupDisplayType: 'groupRows',
    rowGroupPanelShow: 'always',

    // Sidebar
    sideBar: {
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          toolPanelParams: {
            suppressRowGroups: false,
            suppressValues: false,
            suppressPivots: false,
            suppressPivotMode: false,
            suppressColumnFilter: false,
            suppressColumnSelectAll: false,
            suppressColumnExpandAll: false,
          },
        },
        {
          id: 'filters',
          labelDefault: 'Filters',
          labelKey: 'filters',
          iconKey: 'filter',
          toolPanel: 'agFiltersToolPanel',
        },
      ],
      defaultToolPanel: 'columns',
    },
  }), [config?.gridOptions]);

  // Handle grid ready
  const onGridReady = useCallback((params: GridReadyEvent) => {
    logger.info('Grid ready', { columnCount: params.api.getColumns()?.length }, 'DataGrid');

    // Apply column state if available
    if (config?.columnState) {
      params.api.applyColumnState({
        state: config.columnState,
        applyOrder: true
      });
    }

    // Apply row groups if available
    if (config?.rowGroupCols) {
      params.api.setGridOption('rowGroupPanelShow', 'always');
    }
  }, [config?.columnState, config?.rowGroupCols]);

  // Handle column state changes
  const onColumnMoved = useCallback(() => {
    if (gridRef.current && onConfigChange) {
      const columnState = gridRef.current.api.getColumnState();
      onConfigChange({ columnState });
      logger.debug('Column moved', { columnState }, 'DataGrid');
    }
  }, [onConfigChange]);

  const onColumnResized = useCallback(() => {
    if (gridRef.current && onConfigChange) {
      const columnState = gridRef.current.api.getColumnState();
      onConfigChange({ columnState });
      logger.debug('Column resized', { columnState }, 'DataGrid');
    }
  }, [onConfigChange]);

  const onColumnVisible = useCallback(() => {
    if (gridRef.current && onConfigChange) {
      const columnState = gridRef.current.api.getColumnState();
      onConfigChange({ columnState });
      logger.debug('Column visibility changed', { columnState }, 'DataGrid');
    }
  }, [onConfigChange]);

  const onSortChanged = useCallback(() => {
    if (gridRef.current && onConfigChange) {
      const columnState = gridRef.current.api.getColumnState();
      onConfigChange({ columnState });
      logger.debug('Sort changed', { columnState }, 'DataGrid');
    }
  }, [onConfigChange]);

  const onRowGroupOpened = useCallback(() => {
    if (gridRef.current && onConfigChange) {
      const columnState = gridRef.current.api.getColumnState();
      onConfigChange({ columnState });
      logger.debug('Row group changed', { columnState }, 'DataGrid');
    }
  }, [onConfigChange]);

  // Handle data updates
  const onRowDataUpdated = useCallback((event: RowDataUpdatedEvent) => {
    logger.debug('Row data updated', { rowCount: event.api.getDisplayedRowCount() }, 'DataGrid');
  }, []);

  // Auto-size columns on first data load
  useEffect(() => {
    if (gridRef.current && rowData.length > 0) {
      const allColumnIds = gridRef.current.api.getColumns()?.map(col => col.getId()) || [];
      gridRef.current.api.autoSizeColumns(allColumnIds, false);
    }
  }, [rowData.length]);

  return (
    <div className={`ag-theme-quartz ${className}`} style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        gridOptions={gridOptions}
        onGridReady={onGridReady}
        onColumnMoved={onColumnMoved}
        onColumnResized={onColumnResized}
        onColumnVisible={onColumnVisible}
        onSortChanged={onSortChanged}
        onRowGroupOpened={onRowGroupOpened}
        onRowDataUpdated={onRowDataUpdated}
        onRowClicked={(event) => onRowClicked?.(event.data)}
      />
    </div>
  );
};
