/**
 * DataProvider Editor Component
 * Main interface for managing DataProvider configurations
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus,
  Save,
  Trash2,
  Copy,
  Undo,
  Redo,
  AlertCircle,
  CheckCircle,
  Download,
  Upload,
  Play
} from 'lucide-react';

import { useDataProviderStore } from '@/stores/dataProviderStore';
import { ProviderList } from './ProviderList';
import { ProviderForm } from './ProviderForm';
import { TypeSelectionDialog } from './TypeSelectionDialog';
import { DataProviderConfig, PROVIDER_TYPES, getDefaultProviderConfig, ProviderType } from '@stern/shared-types';
import { logger } from '@/utils/logger';

interface DataProviderEditorProps {
  userId?: string;
}

export const DataProviderEditor: React.FC<DataProviderEditorProps> = ({
  userId = 'default-user'
}) => {
  const { toast } = useToast();
  const store = useDataProviderStore();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);

  // Load providers on mount
  useEffect(() => {
    store.loadProviders(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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

    store.setCurrentProvider(newProvider);
    store.setDirty(true);

    logger.info('New provider created', { providerType }, 'DataProviderEditor');
  }, [store, userId]);

  // Handle save provider
  const handleSave = useCallback(async () => {
    const { currentProvider } = store;

    console.log('=== SAVE BUTTON CLICKED ===');
    console.log('Current Provider:', currentProvider);

    if (!currentProvider) {
      toast({
        title: 'Error',
        description: 'No provider to save',
        variant: 'destructive'
      });
      return;
    }

    // Simplified validation - only check datasource name
    if (!currentProvider.name || currentProvider.name.trim() === '') {
      console.error('Validation failed: Datasource name is required');
      toast({
        title: 'Validation Failed',
        description: 'Datasource name is required',
        variant: 'destructive'
      });
      return;
    }

    console.log('Validation passed, proceeding to save...');

    try {
      if (currentProvider.providerId) {
        // Update existing
        console.log('Updating existing provider...');
        await store.updateProvider(currentProvider.providerId, currentProvider, userId);
        toast({
          title: 'Provider Updated',
          description: `${currentProvider.name} has been updated successfully`
        });
      } else {
        // Create new
        console.log('Creating new provider...');
        await store.createProvider(currentProvider, userId);
        toast({
          title: 'Provider Created',
          description: `${currentProvider.name} has been created successfully`
        });
      }
      console.log('Save completed successfully');
    } catch (error: any) {
      console.error('Save failed:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save provider',
        variant: 'destructive'
      });
    }
  }, [store, userId, toast]);

  // Handle delete provider
  const handleDelete = useCallback(async () => {
    const { currentProvider } = store;

    if (!currentProvider?.providerId) {
      return;
    }

    if (!confirm(`Are you sure you want to delete "${currentProvider.name}"?`)) {
      return;
    }

    try {
      await store.deleteProvider(currentProvider.providerId);
      toast({
        title: 'Provider Deleted',
        description: `${currentProvider.name} has been deleted`
      });
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete provider',
        variant: 'destructive'
      });
    }
  }, [store, toast]);

  // Handle clone provider
  const handleClone = useCallback(async () => {
    const { currentProvider } = store;

    if (!currentProvider?.providerId) {
      return;
    }

    const newName = prompt('Enter name for cloned provider:', `${currentProvider.name} (Copy)`);

    if (!newName) {
      return;
    }

    try {
      await store.cloneProvider(currentProvider.providerId, newName, userId);
      toast({
        title: 'Provider Cloned',
        description: `Cloned as "${newName}"`
      });
    } catch (error: any) {
      toast({
        title: 'Clone Failed',
        description: error.message || 'Failed to clone provider',
        variant: 'destructive'
      });
    }
  }, [store, userId, toast]);

  // Handle export provider
  const handleExport = useCallback(() => {
    const { currentProvider } = store;

    if (!currentProvider) {
      return;
    }

    setIsExporting(true);

    try {
      const dataStr = JSON.stringify(currentProvider, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `provider-${currentProvider.name.replace(/\s+/g, '-').toLowerCase()}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast({
        title: 'Provider Exported',
        description: `Exported as ${exportFileDefaultName}`
      });
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export provider',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  }, [store, toast]);

  // Handle import provider
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      setIsImporting(true);

      try {
        const text = await file.text();
        const imported = JSON.parse(text) as DataProviderConfig;

        // Remove ID so it creates a new provider
        delete imported.providerId;
        imported.userId = userId;
        imported.name = `${imported.name} (Imported)`;

        store.setCurrentProvider(imported);
        store.setDirty(true);

        toast({
          title: 'Provider Imported',
          description: 'Provider configuration loaded. Click Save to create it.'
        });
      } catch (error: any) {
        toast({
          title: 'Import Failed',
          description: error.message || 'Failed to import provider',
          variant: 'destructive'
        });
      } finally {
        setIsImporting(false);
      }
    };

    input.click();
  }, [store, userId, toast]);

  // Handle set default
  const handleSetDefault = useCallback(async () => {
    const { currentProvider } = store;

    if (!currentProvider?.providerId) {
      toast({
        title: 'Error',
        description: 'Save the provider first before setting it as default',
        variant: 'destructive'
      });
      return;
    }

    try {
      await store.setDefault(currentProvider.providerId, userId);
      toast({
        title: 'Default Provider Set',
        description: `${currentProvider.name} is now the default provider`
      });
    } catch (error: any) {
      toast({
        title: 'Failed',
        description: error.message || 'Failed to set default provider',
        variant: 'destructive'
      });
    }
  }, [store, userId, toast]);

  const { currentProvider, isDirty, validationResult, canUndo, canRedo } = store;

  return (
    <div className="flex h-full bg-[#1a1a1a] datasource-config-window">
      {/* Left Sidebar - Fixed 320px width matching AGV3 */}
      <div className="w-80 border-r border-[#3a3a3a] flex flex-col bg-[#242424]">
        <div className="p-4 border-b border-[#3a3a3a]">
          <h2 className="text-lg font-semibold text-white">Datasources</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <ProviderList userId={userId} />
        </div>
        <div className="p-3 border-t border-[#3a3a3a]">
          <Button onClick={handleCreate} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#1a1a1a]">
        {currentProvider ? (
          <ProviderForm
            userId={userId}
            onSave={handleSave}
            onCancel={() => store.setCurrentProvider(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
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
