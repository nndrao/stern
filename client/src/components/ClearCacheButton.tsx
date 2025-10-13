/**
 * Clear Cache Button Component
 * Adds a button to clear OpenFin cache and reload
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { clearCacheAndReload } from '@/utils/openfinCache';

interface ClearCacheButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const ClearCacheButton: React.FC<ClearCacheButtonProps> = ({
  variant = 'outline',
  size = 'default',
  showIcon = true,
  children = 'Clear Cache & Reload'
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const handleClearCache = async () => {
    try {
      setIsClearing(true);

      toast({
        title: 'Clearing Cache',
        description: 'Please wait...'
      });

      await clearCacheAndReload();

      // This won't be reached because the app will reload
      // But just in case:
      toast({
        title: 'Cache Cleared',
        description: 'Application reloaded successfully'
      });
    } catch (error: any) {
      setIsClearing(false);
      toast({
        title: 'Failed to Clear Cache',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClearCache}
      disabled={isClearing}
    >
      {isClearing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Clearing...
        </>
      ) : (
        <>
          {showIcon && <Trash2 className="h-4 w-4 mr-2" />}
          {children}
        </>
      )}
    </Button>
  );
};
