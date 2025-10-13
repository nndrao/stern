/**
 * Type Selection Dialog
 * Modal for selecting datasource type when creating new datasource
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Database, Code } from 'lucide-react';
import { ProviderType } from '@stern/shared-types';

interface TypeSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: ProviderType) => void;
}

export const TypeSelectionDialog: React.FC<TypeSelectionDialogProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const handleSelect = (type: ProviderType) => {
    onSelect(type);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Datasource Type</DialogTitle>
          <DialogDescription>
            Choose the type of datasource you want to create
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-6">
          {/* STOMP Datasource */}
          <button
            onClick={() => handleSelect('stomp')}
            className="flex flex-col items-center justify-center p-8 border-2 border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
          >
            <Database className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold">STOMP Datasource</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Real-time data via WebSocket STOMP protocol
            </p>
          </button>

          {/* App Variables (Mock for now) */}
          <button
            onClick={() => handleSelect('mock')}
            className="flex flex-col items-center justify-center p-8 border-2 border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
          >
            <Code className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold">App Variables</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Application-level configuration variables
            </p>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
