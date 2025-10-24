/**
 * Datasource Tab Bar Component
 * Horizontal tabs for datasource navigation with overflow handling
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Wifi, Globe, Zap, Database, TestTube } from 'lucide-react';
import { DataProviderConfig, ProviderType } from '@stern/shared-types';
import { cn } from '@/lib/utils';

interface DatasourceTabBarProps {
  datasources: DataProviderConfig[];
  currentDatasource: DataProviderConfig | null;
  onSelect: (datasource: DataProviderConfig) => void;
  onCreate: () => void;
  dirtyProviders?: Set<string>; // Set of providerIds with unsaved changes
}

// Provider type icons
const PROVIDER_ICONS: Record<ProviderType, React.ReactNode> = {
  stomp: <Wifi className="w-3.5 h-3.5" />,
  rest: <Globe className="w-3.5 h-3.5" />,
  websocket: <Zap className="w-3.5 h-3.5" />,
  socketio: <Database className="w-3.5 h-3.5" />,
  mock: <TestTube className="w-3.5 h-3.5" />
};

export const DatasourceTabBar: React.FC<DatasourceTabBarProps> = ({
  datasources,
  currentDatasource,
  onSelect,
  onCreate,
  dirtyProviders = new Set()
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Sort datasources: default first, then by name
  const sortedDatasources = useMemo(() => {
    const sorted = [...datasources];
    sorted.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [datasources]);

  // Measure container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate which tabs fit and which overflow
  // Rough estimate: each tab ~150px, + button 80px, overflow button 40px
  const maxVisibleTabs = Math.max(1, Math.floor((containerWidth - 120) / 150));
  const visibleDatasources = sortedDatasources.slice(0, maxVisibleTabs);
  const overflowDatasources = sortedDatasources.slice(maxVisibleTabs);

  const isDirty = (providerId?: string) => {
    return providerId ? dirtyProviders.has(providerId) : false;
  };

  const renderTab = (datasource: DataProviderConfig, isInDropdown = false) => {
    const isActive = currentDatasource?.providerId === datasource.providerId;
    const dirty = isDirty(datasource.providerId);

    if (isInDropdown) {
      return (
        <DropdownMenuItem
          key={datasource.providerId || datasource.name}
          onClick={() => onSelect(datasource)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="text-muted-foreground">
            {PROVIDER_ICONS[datasource.providerType]}
          </span>
          <span className="flex-1 truncate text-xs">{datasource.name}</span>
          {dirty && <span className="text-orange-500 text-sm">•</span>}
        </DropdownMenuItem>
      );
    }

    return (
      <button
        key={datasource.providerId || datasource.name}
        onClick={() => onSelect(datasource)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 border-b-2 transition-colors whitespace-nowrap',
          'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          isActive
            ? 'border-primary bg-background text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        )}
      >
        <span className="flex-shrink-0">
          {PROVIDER_ICONS[datasource.providerType]}
        </span>
        <span className="text-xs font-medium truncate max-w-[120px]">
          {datasource.name}
        </span>
        {dirty && (
          <span className="text-orange-500 text-sm font-bold flex-shrink-0">•</span>
        )}
      </button>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2 border-b border-border bg-muted/30 h-9"
    >
      {/* Visible tabs */}
      <div className="flex items-center flex-1 min-w-0">
        <ScrollArea className="flex-1">
          <div className="flex items-center">
            {visibleDatasources.map(ds => renderTab(ds))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Overflow dropdown */}
      {overflowDatasources.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 flex-shrink-0"
              title={`${overflowDatasources.length} more datasources`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
            {overflowDatasources.map(ds => renderTab(ds, true))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* New button */}
      <Button
        onClick={onCreate}
        size="sm"
        variant="ghost"
        className="h-8 px-2 flex-shrink-0 text-xs"
        title="Create new datasource"
      >
        <Plus className="h-4 w-4 mr-1" />
        New
      </Button>
    </div>
  );
};
