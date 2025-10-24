/**
 * Connection Tab Component
 * Configuration for STOMP connection parameters
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlayCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { StompProviderConfig } from '@stern/shared-types';

interface ConnectionTabProps {
  name: string;
  config: Partial<StompProviderConfig>;
  onChange: (updates: Partial<StompProviderConfig>) => void;
  onNameChange: (name: string) => void;
}

export function ConnectionTab({
  name,
  config,
  onChange,
  onNameChange,
}: ConnectionTabProps) {
  const handleChange = (field: keyof StompProviderConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ [field]: e.target.value });
  };

  const handleNumberChange = (field: keyof StompProviderConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ [field]: parseInt(e.target.value) || 0 });
  };

  const handleCheckboxChange = (field: keyof StompProviderConfig) => (checked: boolean) => {
    onChange({ [field]: checked });
  };

  const handleSelectChange = (field: keyof StompProviderConfig) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ [field]: e.target.value });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* BASIC CONFIGURATION - AGV3 Style */}
          <div>
            <h3 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
              BASIC CONFIGURATION
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="datasource-name" className="text-sm font-normal text-foreground mb-2">
                  Datasource Name *
                </Label>
                <Input
                  id="datasource-name"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Enter datasource name"
                  className="mt-1.5 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <Label htmlFor="websocket-url" className="text-sm font-normal text-foreground mb-2">
                  WebSocket URL *
                </Label>
                <Input
                  id="websocket-url"
                  value={config.websocketUrl || ''}
                  onChange={handleChange('websocketUrl')}
                  placeholder="ws://localhost:8080/stomp"
                  className="mt-1.5 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  STOMP server WebSocket endpoint
                </p>
              </div>
            </div>
          </div>

          {/* TOPIC CONFIGURATION - AGV3 Style */}
          <div>
            <h3 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
              TOPIC CONFIGURATION
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="listener-topic" className="text-sm font-normal text-foreground mb-2">Listener Topic *</Label>
                <Input
                  id="listener-topic"
                  value={config.listenerTopic || ''}
                  onChange={handleChange('listenerTopic')}
                  placeholder="/snapshot/positions/[client-id]"
                  className="mt-1.5 font-mono text-sm bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="request-message" className="text-sm font-normal text-foreground mb-2">Trigger Topic *</Label>
                <Input
                  id="request-message"
                  value={config.requestMessage || ''}
                  onChange={handleChange('requestMessage')}
                  placeholder="/snapshot/positions/[client-id]/1000/50"
                  className="mt-1.5 font-mono text-sm bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="rounded-lg bg-muted/30 border border-border p-3">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Template Variables</Label>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div><code className="bg-background px-1 py-0.5 rounded text-blue-400">[variable]</code> - Replaced with variable-UUID</div>
                  <div><code className="bg-background px-1 py-0.5 rounded text-blue-400">{`{datasource.variable}`}</code> - Replaced with datasource value</div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Example: <code className="bg-background px-1 py-0.5 rounded text-blue-400">{`{AppVariables.ds.Environment}`}</code> → production
                </p>
              </div>
            </div>
          </div>

          {/* DATA CONFIGURATION */}
          <div>
            <h3 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-wider">DATA CONFIGURATION</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="snapshot-token" className="text-sm font-normal text-foreground mb-2">Snapshot End Token</Label>
                <Input
                  id="snapshot-token"
                  value={config.snapshotEndToken || 'Success'}
                  onChange={handleChange('snapshotEndToken')}
                  placeholder="Success"
                  className="mt-1.5 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="key-column" className="text-sm font-normal text-foreground mb-2">Key Column</Label>
                <Input
                  id="key-column"
                  value={config.keyColumn || 'positionId'}
                  onChange={handleChange('keyColumn')}
                  placeholder="positionId"
                  className="mt-1.5 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="snapshot-timeout" className="text-sm font-normal text-foreground mb-2">Snapshot Timeout</Label>
              <div className="relative mt-1.5">
                <Input
                  id="snapshot-timeout"
                  type="number"
                  value={config.snapshotTimeoutMs || 60000}
                  onChange={handleNumberChange('snapshotTimeoutMs')}
                  placeholder="60000"
                  min="10000"
                  max="600000"
                  className="pr-12 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ms</span>
              </div>
            </div>
          </div>

          {/* OPTIONS */}
          <div>
            <h3 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-wider">OPTIONS</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-start"
                checked={config.autoStart || false}
                onCheckedChange={handleCheckboxChange('autoStart')}
                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="auto-start"
                className="text-sm font-normal text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Auto-start on application load
              </label>
            </div>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
