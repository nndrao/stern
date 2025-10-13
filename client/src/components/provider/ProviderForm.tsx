/**
 * Provider Form Component
 * Form for editing DataProvider configurations with protocol-specific fields
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

import { useDataProviderStore } from '@/stores/dataProviderStore';
import {
  ProviderType,
  StompProviderConfig,
  RestProviderConfig,
  WebSocketProviderConfig,
  SocketIOProviderConfig,
  MockProviderConfig,
  getDefaultProviderConfig
} from '@stern/shared-types';
import { StompConfigurationForm } from './stomp/StompConfigurationForm';

interface ProviderFormProps {
  userId: string;
  onSave: () => void;
  onCancel: () => void;
}

export const ProviderForm: React.FC<ProviderFormProps> = ({ userId, onSave, onCancel }) => {
  const store = useDataProviderStore();
  const { currentProvider, updateCurrentProvider, validationResult } = store;

  if (!currentProvider) {
    return null;
  }

  const handleSave = () => {
    console.log('[ProviderForm] Save button clicked');
    onSave();
  };

  const handleFieldChange = (field: string, value: any) => {
    updateCurrentProvider({ [field]: value });
  };

  const handleConfigChange = (field: string, value: any) => {
    updateCurrentProvider({
      config: {
        ...currentProvider.config,
        [field]: value
      }
    });
  };

  const handleProviderTypeChange = (newType: ProviderType) => {
    updateCurrentProvider({
      providerType: newType,
      config: getDefaultProviderConfig(newType) as any
    });
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0);
    handleFieldChange('tags', tags);
  };

  // Determine if we're in edit mode (has providerId) or create mode (no providerId)
  const isEditMode = Boolean(currentProvider.providerId);

  return (
    <div className="flex flex-col h-full">
      {/* Main content area - STOMP goes straight to tabs */}
      <div className="flex-1 overflow-hidden">
        {currentProvider.providerType === 'stomp' ? (
          /* Enhanced STOMP Configuration with full 3-tab interface */
          <StompConfigurationForm
            name={currentProvider.name}
            config={currentProvider.config as StompProviderConfig}
            onChange={handleConfigChange}
            onNameChange={(name) => handleFieldChange('name', name)}
            onSave={handleSave}
            onCancel={onCancel}
            isEditMode={isEditMode}
          />
        ) : (
          <div className="flex flex-col h-full">
            {/* Header with datasource name for non-STOMP */}
            <div className="p-4 border-b border-[#3a3a3a]">
              <Input
                value={currentProvider.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Datasource Name"
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent text-white"
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {/* Basic Information for non-STOMP providers */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>Provider identification and metadata</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={currentProvider.description || ''}
                          onChange={(e) => handleFieldChange('description', e.target.value)}
                          placeholder="Optional description of this provider"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          value={currentProvider.tags?.join(', ') || ''}
                          onChange={(e) => handleTagsChange(e.target.value)}
                          placeholder="e.g., trading, real-time, production"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Protocol-Specific Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Connection Configuration</CardTitle>
                      <CardDescription>
                        {currentProvider.providerType.toUpperCase()} protocol settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="connection">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="connection">Connection</TabsTrigger>
                          <TabsTrigger value="advanced">Advanced</TabsTrigger>
                        </TabsList>

                        <TabsContent value="connection" className="space-y-4 mt-4">
                          {currentProvider.providerType === 'rest' && (
                            <RestConfigForm
                              config={currentProvider.config as RestProviderConfig}
                              onChange={handleConfigChange}
                            />
                          )}

                          {currentProvider.providerType === 'websocket' && (
                            <WebSocketConfigForm
                              config={currentProvider.config as WebSocketProviderConfig}
                              onChange={handleConfigChange}
                            />
                          )}

                          {currentProvider.providerType === 'socketio' && (
                            <SocketIOConfigForm
                              config={currentProvider.config as SocketIOProviderConfig}
                              onChange={handleConfigChange}
                            />
                          )}

                          {currentProvider.providerType === 'mock' && (
                            <MockConfigForm
                              config={currentProvider.config as MockProviderConfig}
                              onChange={handleConfigChange}
                            />
                          )}
                        </TabsContent>

                        <TabsContent value="advanced" className="space-y-4 mt-4">
                          {currentProvider.providerType === 'stomp' && (
                            <StompAdvancedForm
                              config={currentProvider.config as StompProviderConfig}
                              onChange={handleConfigChange}
                            />
                          )}

                          {currentProvider.providerType === 'rest' && (
                            <RestAdvancedForm
                              config={currentProvider.config as RestProviderConfig}
                              onChange={handleConfigChange}
                            />
                          )}

                          {currentProvider.providerType === 'websocket' && (
                            <WebSocketAdvancedForm
                              config={currentProvider.config as WebSocketProviderConfig}
                              onChange={handleConfigChange}
                            />
                          )}

                          {currentProvider.providerType === 'socketio' && (
                            <SocketIOAdvancedForm
                              config={currentProvider.config as SocketIOProviderConfig}
                              onChange={handleConfigChange}
                            />
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </div>

            {/* Bottom Action Bar for non-STOMP */}
            <div className="border-t border-[#3a3a3a] p-4 flex items-center justify-end gap-3 bg-[#1a1a1a]">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={onSave}
                disabled={!validationResult?.isValid}
              >
                Update Datasource
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// OLD STOMP form removed - now using StompConfigurationForm

// STOMP Advanced Form
const StompAdvancedForm: React.FC<{
  config: StompProviderConfig;
  onChange: (field: string, value: any) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="requestBody">Request Body</Label>
      <Textarea
        id="requestBody"
        value={config.requestBody || ''}
        onChange={(e) => onChange('requestBody', e.target.value)}
        placeholder="{}"
        rows={3}
      />
      <p className="text-xs text-muted-foreground">JSON body for snapshot request</p>
    </div>

    <div className="space-y-2">
      <Label htmlFor="snapshotEndToken">Snapshot End Token</Label>
      <Input
        id="snapshotEndToken"
        value={config.snapshotEndToken || ''}
        onChange={(e) => onChange('snapshotEndToken', e.target.value)}
        placeholder="SUCCESS"
      />
      <p className="text-xs text-muted-foreground">Token indicating snapshot completion</p>
    </div>

    <div className="space-y-2">
      <Label htmlFor="snapshotTimeoutMs">Snapshot Timeout (ms)</Label>
      <Input
        id="snapshotTimeoutMs"
        type="number"
        value={config.snapshotTimeoutMs || 60000}
        onChange={(e) => onChange('snapshotTimeoutMs', parseInt(e.target.value))}
      />
    </div>

    <div className="flex items-center space-x-2">
      <Switch
        id="manualTopics"
        checked={config.manualTopics || false}
        onCheckedChange={(checked) => onChange('manualTopics', checked)}
      />
      <Label htmlFor="manualTopics">Enable Template Resolution</Label>
    </div>

    <Separator />

    <div className="space-y-2">
      <Label>Heartbeat Configuration</Label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="heartbeatOutgoing" className="text-xs">Outgoing (ms)</Label>
          <Input
            id="heartbeatOutgoing"
            type="number"
            value={config.heartbeat?.outgoing || 4000}
            onChange={(e) => onChange('heartbeat', {
              ...config.heartbeat,
              outgoing: parseInt(e.target.value)
            })}
          />
        </div>
        <div>
          <Label htmlFor="heartbeatIncoming" className="text-xs">Incoming (ms)</Label>
          <Input
            id="heartbeatIncoming"
            type="number"
            value={config.heartbeat?.incoming || 4000}
            onChange={(e) => onChange('heartbeat', {
              ...config.heartbeat,
              incoming: parseInt(e.target.value)
            })}
          />
        </div>
      </div>
    </div>
  </div>
);

// REST Configuration Form
const RestConfigForm: React.FC<{
  config: RestProviderConfig;
  onChange: (field: string, value: any) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="baseUrl">Base URL *</Label>
      <Input
        id="baseUrl"
        value={config.baseUrl || ''}
        onChange={(e) => onChange('baseUrl', e.target.value)}
        placeholder="https://api.example.com"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="endpoint">Endpoint *</Label>
      <Input
        id="endpoint"
        value={config.endpoint || ''}
        onChange={(e) => onChange('endpoint', e.target.value)}
        placeholder="/v1/positions"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="method">HTTP Method</Label>
      <Select
        value={config.method}
        onValueChange={(value) => onChange('method', value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="GET">GET</SelectItem>
          <SelectItem value="POST">POST</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label htmlFor="pollInterval">Poll Interval (ms)</Label>
      <Input
        id="pollInterval"
        type="number"
        value={config.pollInterval || 5000}
        onChange={(e) => onChange('pollInterval', parseInt(e.target.value))}
      />
    </div>
  </div>
);

// REST Advanced Form
const RestAdvancedForm: React.FC<{
  config: RestProviderConfig;
  onChange: (field: string, value: any) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="pageSize">Page Size</Label>
      <Input
        id="pageSize"
        type="number"
        value={config.pageSize || 100}
        onChange={(e) => onChange('pageSize', parseInt(e.target.value))}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="timeout">Request Timeout (ms)</Label>
      <Input
        id="timeout"
        type="number"
        value={config.timeout || 30000}
        onChange={(e) => onChange('timeout', parseInt(e.target.value))}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="paginationMode">Pagination Mode</Label>
      <Select
        value={config.paginationMode || 'offset'}
        onValueChange={(value) => onChange('paginationMode', value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="offset">Offset-based</SelectItem>
          <SelectItem value="cursor">Cursor-based</SelectItem>
          <SelectItem value="page">Page-based</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

// WebSocket Configuration Form
const WebSocketConfigForm: React.FC<{
  config: WebSocketProviderConfig;
  onChange: (field: string, value: any) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="url">WebSocket URL *</Label>
      <Input
        id="url"
        value={config.url || ''}
        onChange={(e) => onChange('url', e.target.value)}
        placeholder="ws://localhost:8080/ws"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="messageFormat">Message Format *</Label>
      <Select
        value={config.messageFormat}
        onValueChange={(value) => onChange('messageFormat', value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="json">JSON</SelectItem>
          <SelectItem value="binary">Binary</SelectItem>
          <SelectItem value="text">Text</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label htmlFor="protocol">Sub-protocol</Label>
      <Input
        id="protocol"
        value={config.protocol || ''}
        onChange={(e) => onChange('protocol', e.target.value)}
        placeholder="Optional sub-protocol"
      />
    </div>
  </div>
);

// WebSocket Advanced Form
const WebSocketAdvancedForm: React.FC<{
  config: WebSocketProviderConfig;
  onChange: (field: string, value: any) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="heartbeatInterval">Heartbeat Interval (ms)</Label>
      <Input
        id="heartbeatInterval"
        type="number"
        value={config.heartbeatInterval || 30000}
        onChange={(e) => onChange('heartbeatInterval', parseInt(e.target.value))}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="reconnectAttempts">Reconnection Attempts</Label>
      <Input
        id="reconnectAttempts"
        type="number"
        value={config.reconnectAttempts || 5}
        onChange={(e) => onChange('reconnectAttempts', parseInt(e.target.value))}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="reconnectDelay">Reconnection Delay (ms)</Label>
      <Input
        id="reconnectDelay"
        type="number"
        value={config.reconnectDelay || 5000}
        onChange={(e) => onChange('reconnectDelay', parseInt(e.target.value))}
      />
    </div>
  </div>
);

// Socket.IO Configuration Form
const SocketIOConfigForm: React.FC<{
  config: SocketIOProviderConfig;
  onChange: (field: string, value: any) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="url">Server URL *</Label>
      <Input
        id="url"
        value={config.url || ''}
        onChange={(e) => onChange('url', e.target.value)}
        placeholder="http://localhost:3000"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="namespace">Namespace</Label>
      <Input
        id="namespace"
        value={config.namespace || '/'}
        onChange={(e) => onChange('namespace', e.target.value)}
        placeholder="/"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="snapshotEvent">Snapshot Event Name *</Label>
      <Input
        id="snapshotEvent"
        value={config.events?.snapshot || ''}
        onChange={(e) => onChange('events', {
          ...config.events,
          snapshot: e.target.value
        })}
        placeholder="snapshot"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="updateEvent">Update Event Name *</Label>
      <Input
        id="updateEvent"
        value={config.events?.update || ''}
        onChange={(e) => onChange('events', {
          ...config.events,
          update: e.target.value
        })}
        placeholder="update"
      />
    </div>
  </div>
);

// Socket.IO Advanced Form
const SocketIOAdvancedForm: React.FC<{
  config: SocketIOProviderConfig;
  onChange: (field: string, value: any) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="deleteEvent">Delete Event Name</Label>
      <Input
        id="deleteEvent"
        value={config.events?.delete || ''}
        onChange={(e) => onChange('events', {
          ...config.events,
          delete: e.target.value
        })}
        placeholder="delete"
      />
    </div>

    <div className="flex items-center space-x-2">
      <Switch
        id="reconnection"
        checked={config.reconnection ?? true}
        onCheckedChange={(checked) => onChange('reconnection', checked)}
      />
      <Label htmlFor="reconnection">Enable Auto-reconnect</Label>
    </div>

    <div className="space-y-2">
      <Label htmlFor="reconnectionDelay">Reconnection Delay (ms)</Label>
      <Input
        id="reconnectionDelay"
        type="number"
        value={config.reconnectionDelay || 5000}
        onChange={(e) => onChange('reconnectionDelay', parseInt(e.target.value))}
      />
    </div>
  </div>
);

// Mock Configuration Form
const MockConfigForm: React.FC<{
  config: MockProviderConfig;
  onChange: (field: string, value: any) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="dataType">Data Type</Label>
      <Select
        value={config.dataType}
        onValueChange={(value) => onChange('dataType', value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="positions">Positions</SelectItem>
          <SelectItem value="trades">Trades</SelectItem>
          <SelectItem value="orders">Orders</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label htmlFor="rowCount">Row Count</Label>
      <Input
        id="rowCount"
        type="number"
        value={config.rowCount || 20}
        onChange={(e) => onChange('rowCount', parseInt(e.target.value))}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="updateInterval">Update Interval (ms)</Label>
      <Input
        id="updateInterval"
        type="number"
        value={config.updateInterval || 2000}
        onChange={(e) => onChange('updateInterval', parseInt(e.target.value))}
      />
    </div>

    <div className="flex items-center space-x-2">
      <Switch
        id="enableUpdates"
        checked={config.enableUpdates ?? true}
        onCheckedChange={(checked) => onChange('enableUpdates', checked)}
      />
      <Label htmlFor="enableUpdates">Enable Real-time Updates</Label>
    </div>

    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription className="text-xs">
        Mock provider generates random data for testing without external dependencies.
      </AlertDescription>
    </Alert>
  </div>
);
