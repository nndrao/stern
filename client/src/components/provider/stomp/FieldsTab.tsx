/**
 * Fields Tab Component - react-checkbox-tree Edition
 * Interface for selecting fields from inferred schema using a tree component
 */

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Database, Loader2, Info } from 'lucide-react';
import { FieldNode } from './FieldSelector';
import { SimpleTreeView, TreeNode } from './SimpleTreeView';

// Type badge color mapping
const typeColorMap: Record<string, { badge: string; text: string }> = {
  string: {
    badge: 'bg-green-900/20 text-green-400 border-green-800/30',
    text: 'text-green-400',
  },
  number: {
    badge: 'bg-blue-900/20 text-blue-400 border-blue-800/30',
    text: 'text-blue-400',
  },
  boolean: {
    badge: 'bg-yellow-900/20 text-yellow-400 border-yellow-800/30',
    text: 'text-yellow-400',
  },
  date: {
    badge: 'bg-purple-900/20 text-purple-400 border-purple-800/30',
    text: 'text-purple-400',
  },
  object: {
    badge: 'bg-orange-900/20 text-orange-400 border-orange-800/30',
    text: 'text-orange-400',
  },
  array: {
    badge: 'bg-pink-900/20 text-pink-400 border-pink-800/30',
    text: 'text-pink-400',
  },
};

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
  inferring?: boolean;
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
  inferring = false,
}: FieldsTabProps) {
  // Convert FieldNode tree to TreeNode format
  const treeNodes = useMemo((): TreeNode[] => {
    const convert = (field: FieldNode): TreeNode => {
      const isLeaf = field.type !== 'object' || !field.children || field.children.length === 0;

      return {
        id: field.path,
        label: field.name,
        type: field.type,
        sample: field.sample,
        isLeaf,
        children: field.children?.map(convert)
      };
    };

    return inferredFields.map(convert);
  }, [inferredFields]);

  // Filter tree based on search query
  const filteredNodes = useMemo(() => {
    if (!fieldSearchQuery) return treeNodes;

    const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.reduce((acc: TreeNode[], node) => {
        const matchesSearch = node.label.toLowerCase().includes(fieldSearchQuery.toLowerCase()) ||
                             node.id.toLowerCase().includes(fieldSearchQuery.toLowerCase());

        if (node.children) {
          const filteredChildren = filterNodes(node.children);
          if (matchesSearch || filteredChildren.length > 0) {
            acc.push({
              ...node,
              children: filteredChildren.length > 0 ? filteredChildren : node.children
            });
          }
        } else if (matchesSearch) {
          acc.push(node);
        }

        return acc;
      }, []);
    };

    return filterNodes(treeNodes);
  }, [treeNodes, fieldSearchQuery]);

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
    <div className="h-full flex flex-col bg-background">
      {/* Datasource Name at top */}
      <div className="p-4 border-b border-border">
        <Input
          value={name}
          readOnly
          placeholder="Datasource Name"
          className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent cursor-default"
        />
      </div>

      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
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
              checked={selectAllIndeterminate ? 'indeterminate' : selectAllChecked}
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

      {/* Main Content - Tree + Selected Sidebar */}
      <div className="flex-1 flex min-h-0">
        {/* Checkbox Tree */}
        <div className="flex-1 border-r border-border">
          <ScrollArea className="h-full">
            <div className="p-4">
              {filteredNodes.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No fields match your search
                </div>
              ) : (
                <SimpleTreeView
                  nodes={filteredNodes}
                  selected={selectedFields}
                  expanded={expandedFields}
                  onSelect={onFieldToggle}
                  onExpand={onExpandToggle}
                  typeColorMap={typeColorMap}
                />
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Selected Fields Sidebar */}
        <div className="w-64 bg-muted/20 flex flex-col">
          <div className="p-3 border-b border-border">
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
                        className="text-xs font-mono py-1 px-2 bg-accent/50 rounded hover:bg-accent transition-colors"
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
    </div>
  );
}
