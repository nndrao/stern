/**
 * Sidebar Navigation Component
 * Provides navigation for the provider dashboard
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Database,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  tooltip: string;
}

const navItems: NavItem[] = [
  {
    id: 'dock',
    label: 'Dock',
    icon: <LayoutDashboard className="h-5 w-5" />,
    tooltip: 'Configure dock menu items'
  },
  {
    id: 'providers',
    label: 'Data Providers',
    icon: <Database className="h-5 w-5" />,
    tooltip: 'Configure data providers'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    tooltip: 'Application settings'
  },
  {
    id: 'help',
    label: 'Help',
    icon: <HelpCircle className="h-5 w-5" />,
    tooltip: 'Help and documentation'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed = false,
  onCollapsedChange
}) => {
  const { theme, setTheme } = useTheme();

  const handleThemeToggle = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeIcon = () => {
    if (theme === 'light') {
      return <Sun className="h-5 w-5" />;
    } else if (theme === 'dark') {
      return <Moon className="h-5 w-5" />;
    } else {
      return <Monitor className="h-5 w-5" />;
    }
  };

  const getThemeTooltip = () => {
    if (theme === 'light') {
      return 'Light theme (click for dark)';
    } else if (theme === 'dark') {
      return 'Dark theme (click for system)';
    } else {
      return 'System theme (click for light)';
    }
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'relative flex flex-col h-full bg-background border-r transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          {!collapsed && (
            <h2 className="text-lg font-semibold">Stern Platform</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange?.(!collapsed)}
            className={cn(
              'h-8 w-8',
              collapsed && 'mx-auto'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Separator />

        {/* Navigation Items */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTab === item.id ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start transition-colors',
                        collapsed && 'justify-center px-2'
                      )}
                      onClick={() => onTabChange(item.id)}
                    >
                      {item.icon}
                      {!collapsed && (
                        <span className="ml-3">{item.label}</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      <p>{item.tooltip}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-2 border-t">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? 'icon' : 'default'}
                className={cn(
                  'w-full',
                  collapsed ? 'justify-center px-2' : 'justify-start'
                )}
                onClick={handleThemeToggle}
              >
                {getThemeIcon()}
                {!collapsed && (
                  <span className="ml-3">Theme</span>
                )}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                <p>{getThemeTooltip()}</p>
              </TooltipContent>
            )}
          </Tooltip>

          {!collapsed && (
            <div className="mt-4 px-2 text-xs text-muted-foreground">
              <p>Version 1.0.0</p>
              <p className="mt-1">© 2024 Stern Trading</p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};