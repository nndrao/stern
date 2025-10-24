/**
 * Top Tab Bar Component
 * Horizontal navigation bar for the provider dashboard
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Database,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';

interface TopTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: 'dock',
    label: 'Dock',
    icon: <LayoutDashboard className="h-4 w-4" />
  },
  {
    id: 'providers',
    label: 'Data Providers',
    icon: <Database className="h-4 w-4" />
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-4 w-4" />
  },
  {
    id: 'help',
    label: 'Help',
    icon: <HelpCircle className="h-4 w-4" />
  }
];

export const TopTabBar: React.FC<TopTabBarProps> = ({
  activeTab,
  onTabChange
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
      return <Sun className="h-4 w-4" />;
    } else if (theme === 'dark') {
      return <Moon className="h-4 w-4" />;
    } else {
      return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    if (theme === 'light') {
      return 'Light';
    } else if (theme === 'dark') {
      return 'Dark';
    } else {
      return 'System';
    }
  };

  return (
    <div className="flex items-center justify-between h-10 px-3 bg-muted/30 border-b border-border">
      {/* Left: App Title */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">Stern Platform</span>
        <span className="text-xs text-muted-foreground">v1.0.0</span>
      </div>

      {/* Center: Navigation Tabs */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
              activeTab === item.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Right: Theme Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleThemeToggle}
        className="h-8 px-2.5 text-xs gap-1.5"
        title={`Current: ${getThemeLabel()} (click to change)`}
      >
        {getThemeIcon()}
        <span>{getThemeLabel()}</span>
      </Button>
    </div>
  );
};
