/**
 * Provider List Component
 * Displays list of configured data providers with search and filtering
 */

import React, { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Database, Wifi, Globe, Zap, TestTube, Star } from 'lucide-react';

import { useDataProviders } from '@/hooks/useDataProviderQueries';
import { ProviderType, DataProviderConfig } from '@stern/shared-types';

interface ProviderListProps {
  userId: string;
  currentProvider: DataProviderConfig | null;
  onSelect: (provider: DataProviderConfig) => void;
}

// Provider type icons
const PROVIDER_ICONS: Record<ProviderType, React.ReactNode> = {
  stomp: <Wifi className="w-4 h-4" />,
  rest: <Globe className="w-4 h-4" />,
  websocket: <Zap className="w-4 h-4" />,
  socketio: <Database className="w-4 h-4" />,
  mock: <TestTube className="w-4 h-4" />
};

// Provider type colors
const PROVIDER_COLORS: Record<ProviderType, string> = {
  stomp: 'bg-blue-500',
  rest: 'bg-green-500',
  websocket: 'bg-purple-500',
  socketio: 'bg-orange-500',
  mock: 'bg-gray-500'
};

export const ProviderList: React.FC<ProviderListProps> = ({ userId, currentProvider, onSelect }) => {
  const { data: providers = [], isLoading } = useDataProviders(userId);

  // Sort: default first, then by name
  const sortedProviders = useMemo(() => {
    const sorted = [...providers];
    sorted.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [providers]);

  return (
    <div className="flex flex-col h-full">
      {/* Provider List */}
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-2">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : sortedProviders.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No datasources configured
            </div>
          ) : (
            sortedProviders.map((provider) => (
              <div
                key={provider.providerId}
                className={`flex items-center gap-3 px-3 py-2.5 rounded cursor-pointer transition-colors ${
                  currentProvider?.providerId === provider.providerId
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => onSelect(provider)}
              >
                {/* Type Icon */}
                <div className="flex-shrink-0 text-muted-foreground">
                  {PROVIDER_ICONS[provider.providerType]}
                </div>

                {/* Provider Name */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{provider.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {provider.providerType.toUpperCase()}
                  </div>
                </div>

                {/* Default Star */}
                {provider.isDefault && (
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
