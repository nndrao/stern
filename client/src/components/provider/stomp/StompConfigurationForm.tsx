/**
 * STOMP Configuration Form
 * Enhanced 3-tab interface for STOMP provider configuration
 */

import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { ConnectionTab } from './ConnectionTab';
import { FieldsTab } from './FieldsTab';
import { ColumnsTab } from './ColumnsTab';
import { StompProviderConfig, ColumnDefinition } from '@stern/shared-types';
import {
  FieldNode,
  convertFieldInfoToNode,
  convertFieldNodeToInfo,
  collectNonObjectLeaves,
  findFieldByPath
} from './FieldSelector';

interface StompConfigurationFormProps {
  name: string;
  config: StompProviderConfig;
  onChange: (field: string, value: any) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditMode?: boolean;  // true when editing existing, false when creating new
}

export function StompConfigurationForm({ name, config, onChange, onNameChange, onSave, onCancel, isEditMode = false }: StompConfigurationFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('connection');

  // Connection testing state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState('');

  // Field inference state
  const [inferring, setInferring] = useState(false);
  const [inferredFields, setInferredFields] = useState<FieldNode[]>([]);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [selectAllIndeterminate, setSelectAllIndeterminate] = useState(false);

  // Column state
  const [manualColumns, setManualColumns] = useState<ColumnDefinition[]>([]);
  const [fieldColumnOverrides, setFieldColumnOverrides] = useState<Record<string, Partial<ColumnDefinition>>>({});

  // Track if field selections have changed (to show "Update Columns" button)
  const [pendingFieldChanges, setPendingFieldChanges] = useState(false);
  const [committedSelectedFields, setCommittedSelectedFields] = useState<Set<string>>(new Set());

  // Refs to track previous values and prevent infinite loops
  const previousInferredFieldsRef = useRef<string>('');
  const previousColumnsRef = useRef<string>('');
  const isInitialLoadRef = useRef(true);

  // Load existing configuration (only on initial mount)
  useEffect(() => {
    // Only run on initial load, not on subsequent updates
    if (!isInitialLoadRef.current) return;
    isInitialLoadRef.current = false;

    if (config.inferredFields && config.inferredFields.length > 0) {
      const fieldNodes = config.inferredFields.map(convertFieldInfoToNode);
      setInferredFields(fieldNodes);

      // Auto-expand object fields
      const objectPaths = new Set<string>();
      const findObjectFields = (fields: FieldNode[]) => {
        fields.forEach(field => {
          if (field.children) {
            objectPaths.add(field.path);
            findObjectFields(field.children);
          }
        });
      };
      findObjectFields(fieldNodes);
      setExpandedFields(objectPaths);
    }

    if (config.columnDefinitions && config.columnDefinitions.length > 0) {
      // Separate manual columns from field-based columns
      const manual = config.columnDefinitions.filter(col =>
        !config.inferredFields?.some(field => field.path === col.field)
      );
      setManualColumns(manual);

      // Build selected fields set and overrides
      const selected = new Set<string>();
      const overrides: Record<string, Partial<ColumnDefinition>> = {};

      config.columnDefinitions.forEach(col => {
        if (config.inferredFields?.some(field => field.path === col.field)) {
          selected.add(col.field);

          // Extract overrides
          const fieldOverride: Partial<ColumnDefinition> = {};
          if (col.headerName) fieldOverride.headerName = col.headerName;
          if (col.cellDataType) fieldOverride.cellDataType = col.cellDataType;
          if (col.valueFormatter) fieldOverride.valueFormatter = col.valueFormatter;
          if (col.cellRenderer) fieldOverride.cellRenderer = col.cellRenderer;
          if (col.width) fieldOverride.width = col.width;
          if (col.filter !== undefined) fieldOverride.filter = col.filter;
          if (col.sortable !== undefined) fieldOverride.sortable = col.sortable;
          if (col.resizable !== undefined) fieldOverride.resizable = col.resizable;
          if (col.hide !== undefined) fieldOverride.hide = col.hide;
          if (col.type) fieldOverride.type = col.type;

          if (Object.keys(fieldOverride).length > 0) {
            overrides[col.field] = fieldOverride;
          }
        }
      });

      setSelectedFields(selected);
      setCommittedSelectedFields(selected);
      setFieldColumnOverrides(overrides);
    }
  }, []);

  // Update select all checkbox state
  useEffect(() => {
    const allLeafPaths = new Set<string>();

    const collectAllLeafPaths = (fields: FieldNode[]) => {
      fields.forEach(field => {
        if (field.type !== 'object' || !field.children || field.children.length === 0) {
          allLeafPaths.add(field.path);
        }
        if (field.children) {
          collectAllLeafPaths(field.children);
        }
      });
    };

    collectAllLeafPaths(inferredFields);

    const selectedCount = Array.from(allLeafPaths).filter(path => selectedFields.has(path)).length;
    const totalCount = allLeafPaths.size;

    if (selectedCount === 0) {
      setSelectAllChecked(false);
      setSelectAllIndeterminate(false);
    } else if (selectedCount === totalCount) {
      setSelectAllChecked(true);
      setSelectAllIndeterminate(false);
    } else {
      setSelectAllChecked(false);
      setSelectAllIndeterminate(true);
    }
  }, [selectedFields, inferredFields]);

  // Save inferred fields and columns back to config whenever they change
  useEffect(() => {
    if (inferredFields.length > 0 || committedSelectedFields.size > 0) {
      const inferredFieldsData = inferredFields.map(field => convertFieldNodeToInfo(field));

      // Build columns from COMMITTED selections only
      const columnsFromFields = Array.from(committedSelectedFields).map(path => {
        const override = fieldColumnOverrides[path] || {};
        const fieldNode = findFieldByPath(path, inferredFields);
        const mapFieldTypeToCellType = (type: string): ColumnDefinition['cellDataType'] => {
          switch (type) {
            case 'number': return 'number';
            case 'boolean': return 'boolean';
            case 'object': return 'object';
            case 'date': return 'date';
            default: return 'text';
          }
        };
        const cellDataType = override.cellDataType || mapFieldTypeToCellType(fieldNode?.type || 'string');

        const column: ColumnDefinition = {
          field: path,
          headerName: override.headerName || path.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
          cellDataType: cellDataType,
        };

        // Apply overrides
        if (override.valueFormatter) column.valueFormatter = override.valueFormatter;
        if (override.cellRenderer) column.cellRenderer = override.cellRenderer;
        if (override.width) column.width = override.width;
        if (override.filter !== undefined) column.filter = override.filter;
        if (override.sortable !== undefined) column.sortable = override.sortable;
        if (override.resizable !== undefined) column.resizable = override.resizable;
        if (override.hide !== undefined) column.hide = override.hide;
        if (override.type) column.type = override.type;

        // Apply type-specific defaults
        if (cellDataType === 'number') {
          column.type = 'numericColumn';
          column.filter = 'agNumberColumnFilter';
          if (!override.valueFormatter) column.valueFormatter = '2DecimalWithThousandSeparator';
          if (!override.cellRenderer) column.cellRenderer = 'NumericCellRenderer';
        }

        if (cellDataType === 'date' || cellDataType === 'dateString') {
          column.filter = 'agDateColumnFilter';
          if (!override.valueFormatter) column.valueFormatter = 'YYYY-MM-DD HH:mm:ss';
        }

        return column;
      });

      const allColumns = [...columnsFromFields, ...manualColumns];

      // Only update if values have actually changed (using refs to prevent infinite loops)
      const newInferredFields = JSON.stringify(inferredFieldsData);
      const newColumns = JSON.stringify(allColumns);

      if (previousInferredFieldsRef.current !== newInferredFields) {
        previousInferredFieldsRef.current = newInferredFields;
        onChange('inferredFields', inferredFieldsData);
      }
      if (previousColumnsRef.current !== newColumns) {
        previousColumnsRef.current = newColumns;
        onChange('columnDefinitions', allColumns);
      }
    }
  }, [inferredFields, committedSelectedFields, manualColumns, fieldColumnOverrides, onChange]);

  // Ensure manualTopics is always true (topics are always configured manually)
  useEffect(() => {
    if (config.manualTopics !== true) {
      onChange('manualTopics', true);
    }
  }, [config.manualTopics, onChange]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestError('');
    setTestResult(null);

    if (!config.websocketUrl) {
      setTestError('WebSocket URL is required');
      setTesting(false);
      return;
    }

    try {
      const { StompDatasourceProvider } = await import('@/services/providers/StompDatasourceProvider');

      const provider = new StompDatasourceProvider({
        websocketUrl: config.websocketUrl,
        listenerTopic: config.listenerTopic || '',
        requestMessage: config.requestMessage,
        requestBody: config.requestBody,
        snapshotEndToken: config.snapshotEndToken,
        keyColumn: config.keyColumn,
        messageRate: config.messageRate,
        snapshotTimeoutMs: config.snapshotTimeoutMs,
        dataType: config.dataType,
        batchSize: config.batchSize
      });

      const success = await provider.checkConnection();

      if (success) {
        setTestResult({ success: true });
        toast({
          title: 'Connection Successful',
          description: 'Successfully connected to STOMP server',
        });
      } else {
        setTestError('Failed to connect to STOMP server');
        toast({
          title: 'Connection Failed',
          description: 'Could not establish connection to STOMP server',
          variant: 'destructive'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setTestError(errorMessage);
      toast({
        title: 'Connection Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleInferFields = async () => {
    setInferring(true);
    setTestError('');

    if (!config.websocketUrl) {
      setTestError('WebSocket URL is required');
      setInferring(false);
      return;
    }

    try {
      const { StompDatasourceProvider } = await import('@/services/providers/StompDatasourceProvider');
      const { templateResolver } = await import('@/services/template/templateResolver');
      const { v4: uuidv4 } = await import('uuid');

      // Generate session ID for consistent UUID resolution
      const sessionId = uuidv4();

      // Resolve topics with templates (topics are always configured manually)
      let listenerTopic = config.listenerTopic || '';
      let requestMessage = config.requestMessage || '';

      // Use manual topics with template resolution
      listenerTopic = templateResolver.resolveTemplate(listenerTopic, sessionId);
      requestMessage = templateResolver.resolveTemplate(requestMessage, sessionId);

      // Create provider with resolved topics
      const provider = new StompDatasourceProvider({
        websocketUrl: config.websocketUrl,
        listenerTopic,
        requestMessage,
        requestBody: config.requestBody || 'START',
        snapshotEndToken: config.snapshotEndToken || 'Success',
        keyColumn: config.keyColumn,
        messageRate: config.messageRate,
        snapshotTimeoutMs: config.snapshotTimeoutMs || 60000,
        dataType: config.dataType,
        batchSize: config.batchSize
      });

      // Fetch sample data (up to 100 rows)
      const result = await provider.fetchSnapshot(100);

      // Clean up session
      templateResolver.clearSession(sessionId);

      if (!result.success || !result.data || result.data.length === 0) {
        setTestError(result.error || 'No data received from STOMP server');
        toast({
          title: 'Field Inference Failed',
          description: result.error || 'No data received from STOMP server',
          variant: 'destructive'
        });
        setInferring(false);
        return;
      }

      // Infer fields from data
      const inferredFieldsMap = StompDatasourceProvider.inferFields(result.data);

      // Convert to FieldNode array
      const fieldNodes = Object.values(inferredFieldsMap).map(field => convertFieldInfoToNode(field));

      setInferredFields(fieldNodes);

      // Auto-expand object fields
      const objectPaths = new Set<string>();
      const findObjectFields = (fields: FieldNode[]) => {
        fields.forEach(field => {
          if (field.children) {
            objectPaths.add(field.path);
            findObjectFields(field.children);
          }
        });
      };
      findObjectFields(fieldNodes);
      setExpandedFields(objectPaths);

      // DO NOT auto-select fields - user must manually select them

      // Switch to Fields tab
      setActiveTab('fields');

      toast({
        title: 'Fields Inferred',
        description: `Found ${fieldNodes.length} fields from ${result.data.length} sample rows`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to infer fields';
      setTestError(errorMessage);
      toast({
        title: 'Field Inference Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setInferring(false);
    }
  };

  const handleFieldToggle = (path: string) => {
    const field = findFieldByPath(path, inferredFields);
    if (!field) {
      return;
    }

    setSelectedFields(prevSelected => {
      const newSelected = new Set(prevSelected);

      if (field.type === 'object') {
        // For object fields, toggle all non-object leaf children
        const leafPaths = collectNonObjectLeaves(field);
        const allLeavesSelected = leafPaths.every(leafPath => newSelected.has(leafPath));

        if (allLeavesSelected) {
          leafPaths.forEach(leafPath => newSelected.delete(leafPath));
        } else {
          leafPaths.forEach(leafPath => newSelected.add(leafPath));
        }
      } else {
        // For non-object fields, toggle normally
        const wasSelected = newSelected.has(path);

        if (wasSelected) {
          newSelected.delete(path);
        } else {
          newSelected.add(path);
        }
      }

      // Mark as having pending changes
      setPendingFieldChanges(true);

      return newSelected;
    });
  };

  const handleExpandToggle = (path: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFields(newExpanded);
  };

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      // Select all leaf fields
      const allLeafPaths = new Set<string>();
      const collectLeafPaths = (fields: FieldNode[]) => {
        fields.forEach(field => {
          if (field.type !== 'object' || !field.children || field.children.length === 0) {
            allLeafPaths.add(field.path);
          }
          if (field.children) {
            collectLeafPaths(field.children);
          }
        });
      };
      collectLeafPaths(inferredFields);
      setSelectedFields(allLeafPaths);
    } else {
      setSelectedFields(new Set());
    }
    setPendingFieldChanges(true);
  };

  const handleClearAllFields = () => {
    setInferredFields([]);
    setSelectedFields(new Set());
    setCommittedSelectedFields(new Set());
    setFieldSearchQuery('');
    setManualColumns([]);
    setFieldColumnOverrides({});
    setPendingFieldChanges(false);
  };

  const handleUpdateColumns = () => {
    // Commit the current field selections to columns
    setCommittedSelectedFields(new Set(selectedFields));
    setPendingFieldChanges(false);
    toast({
      title: 'Columns Updated',
      description: `${selectedFields.size} field(s) will be used as columns`,
    });
  };

  const buildColumnsFromFields = (): ColumnDefinition[] => {
    const findFieldNode = (path: string): FieldNode | undefined => {
      return findFieldByPath(path, inferredFields);
    };

    const mapFieldTypeToCellType = (type: string): ColumnDefinition['cellDataType'] => {
      switch (type) {
        case 'number': return 'number';
        case 'boolean': return 'boolean';
        case 'object': return 'object';
        case 'date': return 'date';
        default: return 'text';
      }
    };

    return Array.from(selectedFields).map(path => {
      const override = fieldColumnOverrides[path] || {};
      const fieldNode = findFieldNode(path);
      const cellDataType = override.cellDataType || mapFieldTypeToCellType(fieldNode?.type || 'string');

      const column: ColumnDefinition = {
        field: path,
        headerName: override.headerName || path.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
        cellDataType: cellDataType,
      };

      // Apply overrides
      if (override.valueFormatter) column.valueFormatter = override.valueFormatter;
      if (override.cellRenderer) column.cellRenderer = override.cellRenderer;
      if (override.width) column.width = override.width;
      if (override.filter !== undefined) column.filter = override.filter;
      if (override.sortable !== undefined) column.sortable = override.sortable;
      if (override.resizable !== undefined) column.resizable = override.resizable;
      if (override.hide !== undefined) column.hide = override.hide;
      if (override.type) column.type = override.type;

      // Apply type-specific defaults
      if (cellDataType === 'number') {
        column.type = 'numericColumn';
        column.filter = 'agNumberColumnFilter';
        if (!override.valueFormatter) column.valueFormatter = '2DecimalWithThousandSeparator';
        if (!override.cellRenderer) column.cellRenderer = 'NumericCellRenderer';
      }

      if (cellDataType === 'date' || cellDataType === 'dateString') {
        column.filter = 'agDateColumnFilter';
        if (!override.valueFormatter) column.valueFormatter = 'YYYY-MM-DD HH:mm:ss';
      }

      return column;
    });
  };

  const updateFormData = (updates: Partial<StompProviderConfig>) => {
    Object.entries(updates).forEach(([key, value]) => {
      onChange(key, value);
    });
  };

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 rounded-none h-12 bg-muted/50 border-b">
          <TabsTrigger value="connection" className="rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Connection
          </TabsTrigger>
          <TabsTrigger value="fields" className="rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary">
            <span>Fields</span>
            {inferredFields.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                {inferredFields.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="columns" className="rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary">
            <span>Columns</span>
            {(committedSelectedFields.size + manualColumns.length) > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                {committedSelectedFields.size + manualColumns.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="connection" className="h-full overflow-hidden m-0">
            <ConnectionTab
              name={name}
              config={config}
              onChange={updateFormData}
              onNameChange={onNameChange}
            />
          </TabsContent>

          <TabsContent value="fields" className="h-full overflow-hidden m-0">
            <FieldsTab
              name={name}
              inferredFields={inferredFields}
              selectedFields={selectedFields}
              expandedFields={expandedFields}
              fieldSearchQuery={fieldSearchQuery}
              selectAllChecked={selectAllChecked}
              selectAllIndeterminate={selectAllIndeterminate}
              onFieldToggle={handleFieldToggle}
              onExpandToggle={handleExpandToggle}
              onSearchChange={setFieldSearchQuery}
              onSelectAllChange={handleSelectAllChange}
              onClearAll={handleClearAllFields}
              onInferFields={handleInferFields}
              inferring={inferring}
            />
          </TabsContent>

          <TabsContent value="columns" className="h-full overflow-hidden m-0">
            <ColumnsTab
              name={name}
              selectedFields={committedSelectedFields}
              inferredFields={inferredFields}
              manualColumns={manualColumns}
              fieldColumnOverrides={fieldColumnOverrides}
              onManualColumnsChange={setManualColumns}
              onFieldColumnOverridesChange={setFieldColumnOverrides}
              onClearAll={() => {
                setSelectedFields(new Set());
                setCommittedSelectedFields(new Set());
                setManualColumns([]);
                setFieldColumnOverrides({});
                setPendingFieldChanges(false);
              }}
            />
          </TabsContent>
        </div>

        {/* Unified footer - shows different buttons based on active tab */}
        <div className="sticky bottom-0 flex items-center justify-between p-4 border-t bg-background">
          <div className="flex items-center gap-2">
            {/* Connection tab buttons */}
            {activeTab === 'connection' && (
              <Button
                onClick={handleTestConnection}
                disabled={testing || !config.websocketUrl}
                variant="outline"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
            )}

            {/* Fields tab buttons */}
            {activeTab === 'fields' && (
              <>
                {inferredFields.length === 0 && (
                  <Button
                    onClick={handleInferFields}
                    disabled={inferring || !config.websocketUrl}
                    variant="outline"
                  >
                    {inferring ? 'Inferring...' : 'Infer Fields'}
                  </Button>
                )}
                {inferredFields.length > 0 && pendingFieldChanges && (
                  <Button
                    onClick={handleUpdateColumns}
                    variant="default"
                  >
                    Update Columns
                  </Button>
                )}
              </>
            )}

            {/* Columns tab buttons */}
            {activeTab === 'columns' && (
              <Button
                onClick={() => {
                  setSelectedFields(new Set());
                  setManualColumns([]);
                  setFieldColumnOverrides({});
                }}
                variant="outline"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onCancel}
              variant="ghost"
              className="text-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </Button>
            <Button onClick={onSave} variant="default">
              {isEditMode ? 'Update Datasource' : 'Create Datasource'}
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
