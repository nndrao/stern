/**
 * Blotter Toolbar Component
 *
 * Provides toolbar UI for blotter operations:
 * - Title display
 * - Layout selector
 * - Window cloner
 * - Customization buttons
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Settings2,
  Columns3,
  Paintbrush,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOpenFinWindowState, useOpenFinComponent } from '@/components/openfin/OpenFinComponent';
import { useOpenFinWorkspace } from '@/services/openfin/OpenFinWorkspaceProvider';
import { logger } from '@/utils/logger';

export interface ToolbarProps {
  title: string;
  isOpenFin: boolean;
  children?: React.ReactNode;
}

export function Toolbar({ title, isOpenFin, children }: ToolbarProps) {
  const { maximize, minimize, close } = useOpenFinWindowState();
  const { identity } = useOpenFinComponent();
  const workspace = useOpenFinWorkspace();

  const handleOpenDialog = async (dialogType: string) => {
    const baseUrl = window.location.origin;

    try {
      await workspace.createView({
        name: `${dialogType}-${identity.configId}-${Date.now()}`,
        url: `${baseUrl}/dialog/${dialogType}?configId=${identity.configId}`,
        customData: {
          configId: identity.configId,
          dialogType,
          parentWindow: identity.windowName
        },
        bounds: {
          width: 600,
          height: 500
        }
      });

      logger.info('Opened dialog', { dialogType, configId: identity.configId }, 'Toolbar');
    } catch (error) {
      logger.error('Failed to open dialog', error, 'Toolbar');
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Left: Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      {/* Center: Children (Layout selector, etc.) */}
      <div className="flex items-center gap-2">
        {children}

        <Separator orientation="vertical" className="h-6" />

        {/* Customization Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Customize
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleOpenDialog('conditional-formatting')}>
              <Paintbrush className="h-4 w-4 mr-2" />
              Conditional Formatting
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenDialog('column-groups')}>
              <Columns3 className="h-4 w-4 mr-2" />
              Column Groups
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenDialog('grid-options')}>
              <Settings2 className="h-4 w-4 mr-2" />
              Grid Options
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: Window controls */}
      {isOpenFin && (
        <div className="flex items-center gap-1">
          <Separator orientation="vertical" className="h-6 mx-2" />

          <Button
            variant="ghost"
            size="icon"
            onClick={minimize}
            title="Minimize"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={maximize}
            title="Maximize"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
