import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SternPlatformSettings } from '../types/openfin';

interface PlatformContextType {
  isInitialized: boolean;
  settings: SternPlatformSettings | null;
  error: string | null;
  isOpenFin: boolean;
}

const PlatformContext = createContext<PlatformContextType>({
  isInitialized: false,
  settings: null,
  error: null,
  isOpenFin: false
});

export const usePlatform = () => useContext(PlatformContext);

interface PlatformProviderProps {
  children: React.ReactNode;
}

export const PlatformProvider: React.FC<PlatformProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [settings, setSettings] = useState<SternPlatformSettings | null>(null);
  const [error] = useState<string | null>(null);
  const [isOpenFin, setIsOpenFin] = useState(false);

  useEffect(() => {
    // Check if we're running in OpenFin
    const checkOpenFin = () => {
      return typeof window !== 'undefined' && 'fin' in window && window.fin;
    };

    const openfinAvailable = checkOpenFin();
    setIsOpenFin(!!openfinAvailable);

    if (openfinAvailable) {
      // OpenFin environment - platform is initialized by the provider route
      // Just set defaults and mark as initialized
      const defaultSettings: SternPlatformSettings = {
        theme: 'dark',
        locale: 'en-US',
        features: {
          home: false,
          dock: false,
          store: false,
          notifications: false
        }
      };

      setSettings(defaultSettings);
      setIsInitialized(true);
    } else {
      // Browser environment - initialize with defaults
      console.log('Running in browser mode (non-OpenFin)');

      const defaultSettings: SternPlatformSettings = {
        theme: 'light',
        locale: 'en-US',
        features: {
          home: false,
          dock: false,
          store: false,
          notifications: false
        }
      };

      setSettings(defaultSettings);
      setIsInitialized(true);
    }
  }, []);

  const contextValue: PlatformContextType = {
    isInitialized,
    settings,
    error,
    isOpenFin
  };

  return (
    <PlatformContext.Provider value={contextValue}>
      {children}
    </PlatformContext.Provider>
  );
};