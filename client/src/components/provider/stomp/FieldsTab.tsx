/**
 * Fields Tab Component
 * Interface for selecting fields from inferred schema
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Database, Loader2, Info } from 'lucide-react';
import { FieldNode, filterFields, collectNonObjectLeaves } from './FieldSelector';
import { TreeItem } from './TreeItem';

interface FieldsTabProps {
  name: string;
  inferredFields: FieldNode[];
  selectedFields: Set<string>;
  expandedFields: Set<string>;
  fieldSearchQuery: string;
  selectAllChecked: boolean;
  selectAllIndeterminate: boolean;
  onFieldToggle: (path: string) => void;
  onExpandToggle: (path: string) => void;
  onSearchChange: (query: string) => void;
  onSelectAllChange: (checked: boolean) => void;
  onClearAll: () => void;
  onInferFields?: () => void;
  onSave: () => void;
  onCancel: () => void;
  inferring?: boolean;
  isEditMode?: boolean;
}

export function FieldsTab({
  name,
  inferredFields,
  selectedFields,
  expandedFields,
  fieldSearchQuery,
  selectAllChecked,
  selectAllIndeterminate,
  onFieldToggle,
  onExpandToggle,
  onSearchChange,
  onSelectAllChange,
  onClearAll,
  onInferFields,
  onSave,
  onCancel,
  inferring = false,
  isEditMode = false
}: FieldsTabProps) {
  const filteredFields = filterFields(inferredFields, fieldSearchQuery);

  const renderFieldItem = (field: FieldNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedFields.has(field.path);
    const isObjectField = field.type === 'object';

    // For object fields, determine checkbox state based on children
    let checkboxState: boolean | 'indeterminate' = selectedFields.has(field.path);

    if (isObjectField) {
      const leafPaths = collectNonObjectLeaves(field);
      const selectedCount = leafPaths.filter(path => selectedFields.has(path)).length;

      if (selectedCount === 0) {
        checkboxState = false;
      } else if (selectedCount === leafPaths.length) {
        checkboxState = true;
      } else {
        checkboxState = 'indeterminate';
      }
    }

    return (
      <TreeItem
        key={field.path}
        field={field}
        level={level}
        isExpanded={isExpanded}
        isSelected={checkboxState}
        onSelect={() => onFieldToggle(field.path)}
        onExpandToggle={() => onExpandToggle(field.path)}
        renderChild={renderFieldItem}
        showSample={true}
      />
    );
  };

  if (inferredFields.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md p-8">
          <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Fields Inferred</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Click "Infer Fields" on the Connection tab to fetch sample data and analyze the schema.
          </p>
          {onInferFields && (
            <Button onClick={onInferFields} disabled={inferring}>
              {inferring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inferring...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Infer Fields
                </>
              )}
            </Button>
          )}
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
      <div className="p-4 border-b border-[#3a3a3a] space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={fieldSearchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Select All / Clear All */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectAllChecked}
              // @ts-ignore - indeterminate is valid
              indeterminate={selectAllIndeterminate}
              onCheckedChange={onSelectAllChange}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All Fields
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedFields.size} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              disabled={inferredFields.length === 0}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Select fields to include as columns. Object fields show all nested properties.
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Content - Field Tree + Selected Sidebar */}
      <div className="flex-1 flex min-h-0">
        {/* Field Tree */}
        <div className="flex-1 border-r border-[#3a3a3a]">
          <ScrollArea className="h-full">
            <div className="p-4">
              {filteredFields.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No fields match your search
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredFields.map(field => renderFieldItem(field, 0))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Selected Fields Sidebar */}
        <div className="w-64 bg-[#1a1a1a] flex flex-col">
          <div className="p-3 border-b border-[#3a3a3a]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Selected Fields
              </h4>
              <Badge variant="secondary" className="text-xs">
                {selectedFields.size}
              </Badge>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3">
              {selectedFields.size === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No fields selected
                </div>
              ) : (
                <div className="space-y-1">
                  {Array.from(selectedFields)
                    .sort((a, b) => a.localeCompare(b))
                    .map(path => (
                      <div
                        key={path}
                        className="text-xs font-mono text-gray-300 py-1 px-2 bg-[#2a2a2a] rounded hover:bg-[#3a3a3a] transition-colors"
                      >
                        {path}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Bottom Action Bar - AGV3 Style */}
      <div className="border-t border-[#3a3a3a] p-4 flex-shrink-0 bg-[#1a1a1a] dialog-footer">
        <div className="flex gap-2 justify-between items-center">
          <div className="text-sm text-gray-400">
            {selectedFields.size} field{selectedFields.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            {onInferFields && (
              <Button
                onClick={onInferFields}
                disabled={inferring}
                variant="outline"
              >
                {inferring ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inferring...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Infer Fields
                  </>
                )}
              </Button>
            )}
            <Button onClick={onSave} variant="default">
              {isEditMode ? 'Update Datasource' : 'Create Datasource'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
