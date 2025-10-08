/**
 * Column Groups Dialog
 *
 * Allows users to create and manage column groups for the data grid.
 * Uses OpenFin IAB to communicate with parent window.
 */

import React, { useState, useEffect } from 'react';
import {
  OpenFinComponentProvider,
  useOpenFinComponent,
  useOpenFinConfig,
  useOpenFinIAB
} from '@/components/openfin/OpenFinComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Save, GripVertical } from 'lucide-react';
import { logger } from '@/utils/logger';

// Column group interface
interface ColumnGroup {
  groupId: string;
  headerName: string;
  children: string[];
  marryChildren?: boolean;
}

interface GridConfig {
  columns?: any[];
  columnGroups?: ColumnGroup[];
}

function ColumnGroupsDialogContent() {
  const { identity, broadcast, updateConfig } = useOpenFinComponent();
  const { config, isLoading } = useOpenFinConfig<GridConfig>();
  const { toast } = useToast();

  const [groups, setGroups] = useState<ColumnGroup[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  // Load groups from config
  useEffect(() => {
    if (config?.columnGroups) {
      setGroups(config.columnGroups);
    }

    // Extract available column names from config
    if (config?.columns) {
      const columnNames = config.columns
        .filter(col => col.field)
        .map(col => col.field as string);
      setAvailableColumns(columnNames);
    }
  }, [config]);

  // Listen for config updates from parent
  useOpenFinIAB(
    `stern.grid.configUpdated.${identity.configId}`,
    (message) => {
      if (message.payload?.changes?.columnGroups) {
        setGroups(message.payload.changes.columnGroups);
      }
    },
    []
  );

  const handleAddGroup = () => {
    const newGroup: ColumnGroup = {
      groupId: `group-${Date.now()}`,
      headerName: 'New Group',
      children: [],
      marryChildren: false
    };

    setGroups([...groups, newGroup]);
  };

  const handleUpdateGroup = (index: number, updates: Partial<ColumnGroup>) => {
    const updatedGroups = [...groups];
    updatedGroups[index] = { ...updatedGroups[index], ...updates };
    setGroups(updatedGroups);
  };

  const handleDeleteGroup = (index: number) => {
    const updatedGroups = groups.filter((_, i) => i !== index);
    setGroups(updatedGroups);
  };

  const handleToggleColumn = (groupIndex: number, columnName: string) => {
    const group = groups[groupIndex];
    const children = group.children.includes(columnName)
      ? group.children.filter(c => c !== columnName)
      : [...group.children, columnName];

    handleUpdateGroup(groupIndex, { children });
  };

  const handleSave = async () => {
    try {
      await updateConfig({
        config: {
          ...config,
          columnGroups: groups
        }
      });

      broadcast(`stern.dialog.saved.${identity.configId}`, {
        type: 'columnGroups',
        payload: { columnGroups: groups },
        timestamp: new Date().toISOString()
      });

      logger.info('Column groups saved', {
        configId: identity.configId,
        groupCount: groups.length
      }, 'ColumnGroupsDialog');

      toast({
        title: 'Groups saved',
        description: `Saved ${groups.length} column group(s)`
      });
    } catch (error) {
      logger.error('Failed to save column groups', error, 'ColumnGroupsDialog');

      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Column Groups</h2>
        <p className="text-sm text-muted-foreground">
          Organize columns into groups with headers
        </p>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-auto p-4">
        {groups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No column groups configured</p>
            <p className="text-sm mt-2">Click "Add Group" to create one</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group, index) => (
              <div key={group.groupId} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Group {index + 1}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteGroup(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {/* Group Name */}
                  <div className="space-y-2">
                    <Label>Group Header</Label>
                    <Input
                      value={group.headerName}
                      onChange={(e) => handleUpdateGroup(index, { headerName: e.target.value })}
                      placeholder="e.g., Trade Details"
                    />
                  </div>

                  {/* Marry Children Option */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`marry-${group.groupId}`}
                      checked={group.marryChildren}
                      onCheckedChange={(checked) =>
                        handleUpdateGroup(index, { marryChildren: checked as boolean })
                      }
                    />
                    <Label htmlFor={`marry-${group.groupId}`} className="text-sm cursor-pointer">
                      Lock children together (marryChildren)
                    </Label>
                  </div>

                  {/* Column Selection */}
                  <div className="space-y-2">
                    <Label>Columns in Group ({group.children.length})</Label>
                    <div className="border rounded-md p-3 max-h-48 overflow-auto space-y-2">
                      {availableColumns.map((columnName) => (
                        <div key={columnName} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${group.groupId}-${columnName}`}
                            checked={group.children.includes(columnName)}
                            onCheckedChange={() => handleToggleColumn(index, columnName)}
                          />
                          <Label
                            htmlFor={`${group.groupId}-${columnName}`}
                            className="text-sm cursor-pointer font-mono"
                          >
                            {columnName}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-4 flex items-center justify-between">
        <Button variant="outline" onClick={handleAddGroup} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Group
        </Button>

        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}

export interface ColumnGroupsDialogProps {
  configId?: string;
}

export function ColumnGroupsDialog({ configId }: ColumnGroupsDialogProps) {
  return (
    <OpenFinComponentProvider
      configId={configId}
      autoLoadConfig={true}
      autoSetupIAB={true}
      onReady={(identity) => {
        logger.info('ColumnGroupsDialog ready', identity, 'ColumnGroupsDialog');
      }}
    >
      <ColumnGroupsDialogContent />
    </OpenFinComponentProvider>
  );
}
