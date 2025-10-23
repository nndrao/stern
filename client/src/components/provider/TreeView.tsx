/**
 * Tree View Component
 * Displays menu items in a hierarchical tree structure
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  ChevronRight,
  ChevronDown,
  GripVertical,
  Folder,
  Plus,
  Trash2,
  Copy,
  Edit2,
  ExternalLink,
  Maximize2
} from 'lucide-react';

import { DockMenuItem } from '@/openfin/types/dockConfig';

interface TreeViewProps {
  items: DockMenuItem[];
  selectedId?: string;
  onSelect?: (item: DockMenuItem) => void;
  onReorder?: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  onUpdate?: (id: string, updates: Partial<DockMenuItem>) => void;
  onAdd?: (parentId?: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

interface TreeNodeProps {
  item: DockMenuItem;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onReorder: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  onUpdate: (updates: Partial<DockMenuItem>) => void;
  onAdd: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  item,
  level,
  isSelected,
  isExpanded,
  onToggle,
  onSelect,
  onReorder,
  onUpdate,
  onAdd,
  onDelete,
  onDuplicate
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | 'inside' | null>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    if (y < height * 0.25) {
      setDragPosition('before');
    } else if (y > height * 0.75) {
      setDragPosition('after');
    } else {
      setDragPosition('inside');
    }

    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
    setDragPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');

    if (sourceId && sourceId !== item.id && dragPosition) {
      onReorder(sourceId, item.id, dragPosition);
    }

    setIsDragOver(false);
    setDragPosition(null);
  };

  const hasChildren = item.children && item.children.length > 0;
  const icon = hasChildren
    ? (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)
    : <div className="w-4" />;

  const itemIcon = hasChildren
    ? <Folder className="h-4 w-4" />
    : item.openMode === 'window'
    ? <ExternalLink className="h-4 w-4" />
    : <Maximize2 className="h-4 w-4" />;

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              'group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
              isSelected && 'bg-accent text-accent-foreground',
              !isSelected && 'hover:bg-accent/50',
              isDragOver && dragPosition === 'inside' && 'bg-primary/20',
              isDragOver && dragPosition === 'before' && 'border-t-2 border-primary',
              isDragOver && dragPosition === 'after' && 'border-b-2 border-primary'
            )}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={onSelect}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <GripVertical className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity cursor-move" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) onToggle();
              }}
            >
              {icon}
            </Button>
            {itemIcon}
            <span className="flex-1 truncate">{item.caption}</span>
            {item.children && item.children.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({item.children.length})
              </span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Child Item
          </ContextMenuItem>
          <ContextMenuItem onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </ContextMenuItem>
          <ContextMenuItem onClick={() => {
            const newCaption = prompt('Rename item:', item.caption);
            if (newCaption) {
              onUpdate({ caption: newCaption });
            }
          }}>
            <Edit2 className="h-4 w-4 mr-2" />
            Rename
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};

export const TreeView: React.FC<TreeViewProps> = ({
  items,
  selectedId,
  onSelect,
  onReorder,
  onUpdate,
  onAdd,
  onDelete,
  onDuplicate
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const renderTree = (items: DockMenuItem[], level = 0): React.ReactNode[] => {
    return items.map(item => {
      const isExpanded = expandedIds.has(item.id);
      const isSelected = selectedId === item.id;

      return (
        <React.Fragment key={item.id}>
          <TreeNode
            item={item}
            level={level}
            isSelected={isSelected}
            isExpanded={isExpanded}
            onToggle={() => toggleExpanded(item.id)}
            onSelect={() => onSelect?.(item)}
            onReorder={(sourceId, targetId, position) => onReorder?.(sourceId, targetId, position)}
            onUpdate={(updates) => onUpdate?.(item.id, updates)}
            onAdd={() => onAdd?.(item.id)}
            onDelete={() => onDelete?.(item.id)}
            onDuplicate={() => onDuplicate?.(item.id)}
          />
          {isExpanded && item.children && renderTree(item.children, level + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        {!items || items.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No menu items</p>
            <p className="text-sm mt-2">Click "Add Item" to create your first menu item</p>
          </div>
        ) : (
          renderTree(items)
        )}
      </div>
    </ScrollArea>
  );
};