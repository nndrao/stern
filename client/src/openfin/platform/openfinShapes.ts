import type { App } from "@openfin/workspace";

/**
 * Bootstrap configuration for workspace components.
 */
export interface BootstrapConfig {
  /**
   * Whether to bootstrap the home component.
   */
  home?: boolean;

  /**
   * Whether to bootstrap the store component.
   */
  store?: boolean;

  /**
   * Whether to bootstrap the dock component.
   */
  dock?: boolean;

  /**
   * Whether to bootstrap the notifications component.
   */
  notifications?: boolean;
}

/**
 * The custom settings stored in the manifest.fin.json.
 */
export interface CustomSettings {
  /**
   * Bootstrap configuration for workspace components.
   */
  bootstrap?: BootstrapConfig;

  /**
   * The applications to populate in the platform.
   */
  apps?: App[];
}

/**
 * The platform settings stored in the manifest.fin.json.
 */
export interface PlatformSettings {
  /**
   * The id for the platform.
   */
  id: string;

  /**
   * The title for the platform.
   */
  title: string;

  /**
   * The icon for the platform.
   */
  icon: string;
}