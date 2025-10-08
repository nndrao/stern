/**
 * Universal Blotter Component
 *
 * Configurable data grid component that can be used for:
 * - Positions
 * - Trades
 * - Orders
 * - Any other blotter type
 *
 * Features:
 * - Automatic config loading via OpenFin wrapper
 * - Layout management
 * - IAB communication for multi-window coordination
 * - Window cloning support
 */

import React, { useState, useEffect } from 'react';
import { OpenFinComponentProvider, useOpenFinComponent, useOpenFinConfig } from '@/components/openfin/OpenFinComponent';
import { Toolbar } from './Toolbar';
import { LayoutSelector } from './LayoutSelector';
import { WindowCloner } from './WindowCloner';
import { DataGrid, DataGridConfig } from '@/components/datagrid/DataGrid';
import { mockDataProvider } from '@/services/dataProvider/MockDataProvider';
import { logger } from '@/utils/logger';

interface BlotterContentProps {
  // Additional props can be added here
}

function BlotterContent({}: BlotterContentProps) {
  const { identity, broadcast, isOpenFin } = useOpenFinComponent();
  const { config, isLoading, error, update } = useOpenFinConfig<DataGridConfig>();
  const [rowData, setRowData] = useState<any[]>([]);

  // Connect to data provider
  useEffect(() => {
    if (!isLoading && config && identity.componentSubType) {
      logger.info('Blotter initialized', {
        configId: identity.configId,
        componentType: identity.componentType,
        componentSubType: identity.componentSubType
      }, 'UniversalBlotter');

      // Connect to mock data provider
      mockDataProvider.connect({
        url: 'mock://localhost',
        protocol: 'rest'
      }).then(() => {
        // Subscribe to data based on component subtype
        const subscriptionId = mockDataProvider.subscribe({
          topic: identity.componentSubType || 'positions',
          onData: (data) => {
            setRowData(data);
          },
          onError: (error) => {
            logger.error('Data provider error', error, 'UniversalBlotter');
          }
        });

        logger.info('Subscribed to data', {
          subscriptionId,
          topic: identity.componentSubType
        }, 'UniversalBlotter');

        // Cleanup on unmount
        return () => {
          mockDataProvider.unsubscribe(subscriptionId);
        };
      });
    }
  }, [isLoading, config, identity]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading blotter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="max-w-md p-6 bg-destructive/10 border border-destructive rounded-lg">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Failed to Load Blotter
          </h2>
          <p className="text-sm text-muted-foreground">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleConfigChange = async (configChanges: any) => {
    try {
      // Update config on server
      await update({
        config: {
          ...config,
          ...configChanges
        }
      });

      // Broadcast to other windows and dialogs
      broadcast(`stern.grid.configUpdated.${identity.configId}`, {
        configId: identity.configId,
        changes: configChanges,
        timestamp: new Date().toISOString()
      });

      logger.debug('Config updated and broadcast', { configChanges }, 'UniversalBlotter');
    } catch (err) {
      logger.error('Failed to update config', err, 'UniversalBlotter');
    }
  };

  const blotterTitle = (identity.componentSubType || 'Blotter').charAt(0).toUpperCase() + (identity.componentSubType || 'Blotter').slice(1);

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Toolbar */}
      <div className="border-b bg-card">
        <Toolbar
          title={blotterTitle}
          isOpenFin={isOpenFin}
        >
          <LayoutSelector />
          {isOpenFin && <WindowCloner />}
        </Toolbar>
      </div>

      {/* Data Grid */}
      <div className="flex-1 p-4">
        <DataGrid
          config={config || undefined}
          rowData={rowData}
          onConfigChange={handleConfigChange}
        />
      </div>
    </div>
  );
}

export interface UniversalBlotterProps {
  configId?: string;
}

/**
 * Universal Blotter - Main export
 * Wraps BlotterContent with OpenFinComponentProvider
 */
export function UniversalBlotter({ configId }: UniversalBlotterProps) {
  return (
    <OpenFinComponentProvider
      configId={configId}
      autoLoadConfig={true}
      autoSetupIAB={true}
      onReady={(identity) => {
        logger.info('UniversalBlotter ready', identity, 'UniversalBlotter');
      }}
      onConfigLoaded={(config) => {
        logger.info('Config loaded', {
          configId: config.configId,
          name: config.name
        }, 'UniversalBlotter');
      }}
      onConfigError={(error) => {
        logger.error('Config load failed', error, 'UniversalBlotter');
      }}
    >
      <BlotterContent />
    </OpenFinComponentProvider>
  );
}
