/**
 * DataProvider Editor Component
 * Main interface for managing DataProvider configurations
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

import { useOpenfinTheme } from '@/openfin/hooks/useOpenfinTheme';
import { ProviderList } from './ProviderList';
import { ProviderForm } from './ProviderForm';
import { TypeSelectionDialog } from './TypeSelectionDialog';
import { DataProviderConfig, getDefaultProviderConfig, ProviderType } from '@stern/shared-types';
import { logger } from '@/utils/logger';

interface DataProviderEditorProps {
  userId?: string;
}

export const DataProviderEditor: React.FC<DataProviderEditorProps> = ({
  userId = 'default-user'
}) => {
  // Sync OpenFin platform theme with React theme provider
  useOpenfinTheme();

  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<DataProviderConfig | null>(null);

  // Handle create new provider - show type selection dialog
  const handleCreate = useCallback(() => {
    setShowTypeDialog(true);
  }, []);

  // Handle type selection from dialog
  const handleTypeSelect = useCallback((providerType: ProviderType) => {
    const newProvider: DataProviderConfig = {
      name: `New ${providerType.toUpperCase()} Datasource`,
      description: '',
      providerType,
      config: getDefaultProviderConfig(providerType) as any,
      tags: [],
      isDefault: false,
      userId
    };

    setCurrentProvider(newProvider);
    logger.info('New provider created', { providerType }, 'DataProviderEditor');
  }, [userId]);


  return (
    <div className="flex h-full bg-background datasource-config-window">
      {/* Left Sidebar - Fixed 320px width matching AGV3 */}
      <div className="w-80 border-r border-border flex flex-col bg-muted/30">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Datasources</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <ProviderList
            userId={userId}
            currentProvider={currentProvider}
            onSelect={setCurrentProvider}
          />
        </div>
        <div className="p-3 border-t border-border">
          <Button onClick={handleCreate} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-background">
        {currentProvider ? (
          <ProviderForm
            userId={userId}
            provider={currentProvider}
            onProviderChange={setCurrentProvider}
            onClose={() => setCurrentProvider(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              Select a datasource or create a new one
            </div>
          </div>
        )}
      </div>

      {/* Type Selection Dialog */}
      <TypeSelectionDialog
        open={showTypeDialog}
        onClose={() => setShowTypeDialog(false)}
        onSelect={handleTypeSelect}
      />
    </div>
  );
};
