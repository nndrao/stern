/**
 * Simple Tree View Component
 * Lightweight tree component using only shadcn/ui primitives
 * Fully compatible with dark/light theme
 */

import { ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TreeNode {
  id: string;                      // Unique identifier (full path)
  label: string;                   // Display name
  type?: string;                   // Field type for badge
  sample?: any;                    // Sample value
  isLeaf?: boolean;                // Is this a selectable leaf
  children?: TreeNode[];           // Child nodes
}

interface TreeNodeProps {
  node: TreeNode;
  level: number;
  isSelected: boolean | 'indeterminate';
  isExpanded: boolean;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  typeColorMap: Record<string, { badge: string; text: string }>;
  selected: Set<string>;
  expanded: Set<string>;
}

function TreeNodeComponent({
  node,
  level,
  isSelected,
  isExpanded,
  onSelect,
  onExpand,
  typeColorMap,
  selected,
  expanded
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const typeColors = node.type ? (typeColorMap[node.type] || typeColorMap.string) : typeColorMap.string;

  // Calculate selection state for a node
  const getSelectionState = (n: TreeNode): boolean | 'indeterminate' => {
    if (n.isLeaf) {
      return selected.has(n.id);
    }

    if (!n.children || n.children.length === 0) {
      return false;
    }

    // Count selected leaf descendants
    const countSelectedLeaves = (node: TreeNode): { selected: number; total: number } => {
      if (node.isLeaf) {
        return { selected: selected.has(node.id) ? 1 : 0, total: 1 };
      }

      if (!node.children) {
        return { selected: 0, total: 0 };
      }

      return node.children.reduce(
        (acc, child) => {
          const childCounts = countSelectedLeaves(child);
          return {
            selected: acc.selected + childCounts.selected,
            total: acc.total + childCounts.total
          };
        },
        { selected: 0, total: 0 }
      );
    };

    const counts = countSelectedLeaves(n);
    if (counts.selected === 0) return false;
    if (counts.selected === counts.total) return true;
    return 'indeterminate';
  };

  return (
    <div className="relative">
      {hasChildren ? (
        <Collapsible open={isExpanded} onOpenChange={() => onExpand(node.id)}>
          <div
            className={cn(
              'flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 transition-colors group',
              level > 0 && 'ml-6'
            )}
          >
            {/* Expand/Collapse Button */}
            <CollapsibleTrigger asChild>
              <button
                className="flex-shrink-0 p-0.5 hover:bg-accent rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand(node.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>

            {/* Type Badge */}
            {node.type && (
              <Badge
                variant="outline"
                className={cn(
                  'flex-shrink-0 px-1.5 py-0 text-[10px] font-mono uppercase',
                  typeColors.badge
                )}
              >
                {node.type}
              </Badge>
            )}

            {/* Node Label */}
            <span className="text-sm font-semibold">{node.label}</span>
          </div>

          <CollapsibleContent>
            {node.children?.map((child) => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                level={level + 1}
                isSelected={getSelectionState(child)}
                isExpanded={expanded.has(child.id)}
                onSelect={onSelect}
                onExpand={onExpand}
                typeColorMap={typeColorMap}
                selected={selected}
                expanded={expanded}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        // Leaf node with checkbox
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer',
            level > 0 && 'ml-6'
          )}
          onClick={() => node.isLeaf && onSelect(node.id)}
        >
          {/* Spacer for alignment with parent expand button */}
          <div className="w-5 flex-shrink-0" />

          {/* Checkbox */}
          {node.isLeaf && (
            <Checkbox
              checked={isSelected === true}
              onCheckedChange={() => onSelect(node.id)}
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0"
            />
          )}

          {/* Type Badge */}
          {node.type && (
            <Badge
              variant="outline"
              className={cn(
                'flex-shrink-0 px-1.5 py-0 text-[10px] font-mono uppercase',
                typeColors.badge
              )}
            >
              {node.type}
            </Badge>
          )}

          {/* Node Label */}
          <span className="text-sm">{node.label}</span>

          {/* Sample Value */}
          {node.isLeaf && node.sample !== undefined && node.sample !== null && (
            <span className="ml-auto text-xs text-muted-foreground opacity-60 truncate max-w-[200px]">
              {String(node.sample)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface SimpleTreeViewProps {
  nodes: TreeNode[];
  selected: Set<string>;
  expanded: Set<string>;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  typeColorMap: Record<string, { badge: string; text: string }>;
}

export function SimpleTreeView({
  nodes,
  selected,
  expanded,
  onSelect,
  onExpand,
  typeColorMap
}: SimpleTreeViewProps) {
  // Calculate selection state for parent nodes
  const getSelectionState = (node: TreeNode): boolean | 'indeterminate' => {
    if (node.isLeaf) {
      return selected.has(node.id);
    }

    if (!node.children || node.children.length === 0) {
      return false;
    }

    // Count selected leaf descendants
    const countSelectedLeaves = (n: TreeNode): { selected: number; total: number } => {
      if (n.isLeaf) {
        return { selected: selected.has(n.id) ? 1 : 0, total: 1 };
      }

      if (!n.children) {
        return { selected: 0, total: 0 };
      }

      return n.children.reduce(
        (acc, child) => {
          const childCounts = countSelectedLeaves(child);
          return {
            selected: acc.selected + childCounts.selected,
            total: acc.total + childCounts.total
          };
        },
        { selected: 0, total: 0 }
      );
    };

    const counts = countSelectedLeaves(node);
    if (counts.selected === 0) return false;
    if (counts.selected === counts.total) return true;
    return 'indeterminate';
  };

  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <TreeNodeComponent
          key={node.id}
          node={node}
          level={0}
          isSelected={getSelectionState(node)}
          isExpanded={expanded.has(node.id)}
          onSelect={onSelect}
          onExpand={onExpand}
          typeColorMap={typeColorMap}
          selected={selected}
          expanded={expanded}
        />
      ))}
    </div>
  );
}
