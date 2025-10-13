/**
 * Columns Tab Component
 * Configure column definitions and overrides
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Trash2, Database, Plus } from 'lucide-react';
import { ColumnDefinition, FieldInfo } from '@stern/shared-types';
import { FieldNode } from './FieldSelector';
import { autoCapitalize } from '@/utils/stringUtils';
import {
  getFormatterOptions,
  getRendererOptions,
  getDefaultFormatter,
  getDefaultRenderer
} from '@/constants/columnFormatters';

interface ManualColumnFormData {
  field: string;
  headerName: string;
  cellDataType: ColumnDefinition['cellDataType'];
}

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
  onSave,
  onCancel,
  onClearAll,
  isEditMode = false
}: ColumnsTabProps) {
  const [manualColumnForm, setManualColumnForm] = React.useState<ManualColumnFormData>({
    field: '',
    headerName: '',
    cellDataType: 'text'
  });

  const findFieldByPath = (path: string, fields: FieldNode[]): FieldNode | undefined => {
    for (const field of fields) {
      if (field.path === path) return field;
      if (field.children) {
        const found = findFieldByPath(path, field.children);
        if (found) return found;
      }
    }
    return undefined;
  };

  const mapFieldTypeToCellType = (type: string): ColumnDefinition['cellDataType'] => {
    switch (type) {
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'object': return 'object';
      case 'date': return 'date';
      default: return 'text';
    }
  };

  const handleOverrideChange = (path: string, field: keyof ColumnDefinition, value: any) => {
    const newOverrides = { ...fieldColumnOverrides };
    if (!newOverrides[path]) {
      newOverrides[path] = {};
    }
    newOverrides[path][field] = value;
    onFieldColumnOverridesChange(newOverrides);
  };

  const handleRemoveManualColumn = (index: number) => {
    const newColumns = [...manualColumns];
    newColumns.splice(index, 1);
    onManualColumnsChange(newColumns);
  };

  const handleAddManualColumn = () => {
    if (!manualColumnForm.field.trim() || !manualColumnForm.headerName.trim()) {
      return; // Validation - both fields required
    }

    const newColumn: ColumnDefinition = {
      field: manualColumnForm.field.trim(),
      headerName: manualColumnForm.headerName.trim(),
      cellDataType: manualColumnForm.cellDataType,
      valueFormatter: getDefaultFormatter(manualColumnForm.cellDataType),
      cellRenderer: getDefaultRenderer(manualColumnForm.cellDataType)
    };

    onManualColumnsChange([...manualColumns, newColumn]);

    // Reset form
    setManualColumnForm({
      field: '',
      headerName: '',
      cellDataType: 'text'
    });
  };

  const totalColumns = selectedFields.size + manualColumns.length;

  if (totalColumns === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md p-8">
          <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Columns Configured</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select fields in the Fields tab to create columns automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Datasource Name at top */}
      <div className="p-4 border-b border-[#3a3a3a]">
        <Input
          value={name}
          readOnly
          placeholder="Datasource Name"
          className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent text-white cursor-default"
        />
      </div>

      {/* Header */}
      <div className="p-4 border-b border-[#3a3a3a]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Column Configuration</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedFields.size} field column{selectedFields.size !== 1 ? 's' : ''}, {manualColumns.length} manual column{manualColumns.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Columns List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Field-Based Columns */}
          {selectedFields.size > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Field Columns
                </h4>
                <Badge variant="secondary">{selectedFields.size}</Badge>
              </div>

              <div className="space-y-3">
                {Array.from(selectedFields).map(path => {
                  const field = findFieldByPath(path, inferredFields);
                  const override = fieldColumnOverrides[path] || {};
                  const cellDataType = override.cellDataType || mapFieldTypeToCellType(field?.type || 'string');

                  return (
                    <Card key={path}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {field?.type || 'unknown'}
                          </Badge>
                          <span className="font-mono">{path}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Header Name</Label>
                            <Input
                              value={override.headerName || autoCapitalize(path)}
                              onChange={(e) => handleOverrideChange(path, 'headerName', e.target.value)}
                              className="h-8 text-xs mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Cell Data Type</Label>
                            <Select
                              value={cellDataType}
                              onValueChange={(value) => handleOverrideChange(path, 'cellDataType', value)}
                            >
                              <SelectTrigger className="h-8 text-xs mt-1">
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

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Value Formatter</Label>
                            <Select
                              value={override.valueFormatter || getDefaultFormatter(cellDataType)}
                              onValueChange={(value) => handleOverrideChange(path, 'valueFormatter', value)}
                            >
                              <SelectTrigger className="h-8 text-xs mt-1">
                                <SelectValue placeholder="Default" />
                              </SelectTrigger>
                              <SelectContent>
                                {getFormatterOptions(cellDataType).map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Cell Renderer</Label>
                            <Select
                              value={override.cellRenderer || getDefaultRenderer(cellDataType)}
                              onValueChange={(value) => handleOverrideChange(path, 'cellRenderer', value)}
                            >
                              <SelectTrigger className="h-8 text-xs mt-1">
                                <SelectValue placeholder="Default" />
                              </SelectTrigger>
                              <SelectContent>
                                {getRendererOptions(cellDataType).map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Manual Column Form */}
          {(selectedFields.size > 0 || manualColumns.length > 0) && <Separator className="my-4" />}

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Add Manual Column
            </h4>

            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Field Name</Label>
                      <Input
                        value={manualColumnForm.field}
                        onChange={(e) => setManualColumnForm({ ...manualColumnForm, field: e.target.value })}
                        placeholder="e.g. customField"
                        className="h-8 text-xs mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Header Name</Label>
                      <Input
                        value={manualColumnForm.headerName}
                        onChange={(e) => setManualColumnForm({ ...manualColumnForm, headerName: e.target.value })}
                        placeholder="e.g. Custom Field"
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Cell Data Type</Label>
                      <Select
                        value={manualColumnForm.cellDataType}
                        onValueChange={(value: ColumnDefinition['cellDataType']) =>
                          setManualColumnForm({ ...manualColumnForm, cellDataType: value })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs mt-1">
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

                    <Button
                      onClick={handleAddManualColumn}
                      size="sm"
                      className="h-8"
                      disabled={!manualColumnForm.field.trim() || !manualColumnForm.headerName.trim()}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Manual Columns */}
          {manualColumns.length > 0 && (
            <>
              <Separator className="my-4" />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Manual Columns
                  </h4>
                  <Badge variant="secondary">{manualColumns.length}</Badge>
                </div>

                <div className="space-y-3">
                  {manualColumns.map((column, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-mono">{column.field}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveManualColumn(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs text-muted-foreground">
                          Header: {column.headerName}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="border-t p-3 bg-muted/50 text-xs text-muted-foreground">
        Total: {totalColumns} column{totalColumns !== 1 ? 's' : ''} configured
      </div>

      {/* Bottom Action Bar - AGV3 Style */}
      <div className="border-t border-[#3a3a3a] p-4 flex-shrink-0 bg-[#1a1a1a] dialog-footer">
        <div className="flex gap-2 justify-end">
          <Button onClick={onSave} variant="default">
            {isEditMode ? 'Update Datasource' : 'Create Datasource'}
          </Button>
        </div>
      </div>
    </div>
  );
}
