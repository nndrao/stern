/**
 * Provider List Component - Enhanced
 * Displays list of configured data providers with search, filtering, and visual indicators
 * Features: Search, gradient icons, status indicators, smooth animations
 */

import React, { useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Database, Wifi, Globe, Zap, TestTube, Star, Search } from 'lucide-react';

import { useDataProviders } from '@/hooks/api/useDataProviderQueries';
import { ProviderType, DataProviderConfig } from '@stern/shared-types';

interface ProviderListProps {
  userId: string;
  currentProvider: DataProviderConfig | null;
  onSelect: (provider: DataProviderConfig) => void;
}

// Provider type icons with consistent sizing
const PROVIDER_ICONS: Record<ProviderType, React.ReactNode> = {
  stomp: <Wifi className="w-4 h-4" />,
  rest: <Globe className="w-4 h-4" />,
  websocket: <Zap className="w-4 h-4" />,
  socketio: <Database className="w-4 h-4" />,
  mock: <TestTube className="w-4 h-4" />
};

// Provider type gradient colors (matching TypeSelectionDialog)
const PROVIDER_GRADIENTS: Record<ProviderType, string> = {
  stomp: 'from-blue-500 to-cyan-500',
  rest: 'from-green-500 to-emerald-500',
  websocket: 'from-purple-500 to-pink-500',
  socketio: 'from-orange-500 to-red-500',
  mock: 'from-gray-500 to-slate-500'
};

export const ProviderList: React.FC<ProviderListProps> = ({ userId, currentProvider, onSelect }) => {
  const { data: providers = [], isLoading } = useDataProviders(userId);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort: search filter, then default first, then by name
  const filteredAndSortedProviders = useMemo(() => {
    let filtered = [...providers];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.providerType.toLowerCase().includes(query)
      );
    }

    // Sort: default first, then by name
    filtered.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [providers, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search datasources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Provider List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-xs text-muted-foreground">Loading datasources...</p>
            </div>
          ) : filteredAndSortedProviders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Database className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground text-center">
                {searchQuery.trim() ? 'No matching datasources' : 'No datasources configured'}
              </p>
            </div>
          ) : (
            filteredAndSortedProviders.map((provider) => {
              const isSelected = currentProvider?.providerId === provider.providerId;
              const gradientClass = PROVIDER_GRADIENTS[provider.providerType];

              return (
                <div
                  key={provider.providerId}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'hover:bg-accent/50 hover:shadow-sm'
                  }`}
                  onClick={() => onSelect(provider)}
                >
                  {/* Gradient Icon */}
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-md bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white shadow-sm transition-shadow duration-200 ${
                      isSelected ? 'shadow-md' : 'group-hover:shadow-md'
                    }`}
                  >
                    {PROVIDER_ICONS[provider.providerType]}
                  </div>

                  {/* Provider Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="text-sm font-medium truncate">{provider.name}</div>
                      {provider.isDefault && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {provider.providerType.toUpperCase()}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      {!isLoading && providers.length > 0 && (
        <div className="px-3 py-2 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {filteredAndSortedProviders.length} of {providers.length} datasource
            {providers.length !== 1 ? 's' : ''}
            {searchQuery.trim() && filteredAndSortedProviders.length !== providers.length && ' shown'}
          </p>
        </div>
      )}
    </div>
  );
};
