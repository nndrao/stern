/**
 * Template Resolver Service
 * Resolves template variables in strings for STOMP topic configuration
 *
 * Supports two types of templates:
 * 1. [variable] - replaced with variable-UUID (session-consistent)
 * 2. {datasource.variable} - replaced with value from datasource (e.g., AppVariables)
 *
 * Based on AGV3 implementation
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';

export class TemplateResolver {
  private static instance: TemplateResolver;
  private uuidCache: Map<string, string> = new Map();

  private constructor() {}

  static getInstance(): TemplateResolver {
    if (!TemplateResolver.instance) {
      TemplateResolver.instance = new TemplateResolver();
    }
    return TemplateResolver.instance;
  }

  /**
   * Resolve all template variables in a string
   *
   * @param template String containing template variables
   * @param sessionId Optional session ID for consistent UUID generation
   * @returns Resolved string with all variables replaced
   *
   * @example
   * // UUID variables
   * resolveTemplate("[client-id]") → "client-id-f47ac10b-58cc-4372-a567-0e02b2c3d479"
   *
   * // With session consistency
   * const sessionId = uuidv4();
   * resolveTemplate("[client-id]", sessionId) → "client-id-abc123..."
   * resolveTemplate("[client-id]", sessionId) → "client-id-abc123..." (same UUID!)
   *
   * // Datasource variables
   * resolveTemplate("{AppVariables.ds.Environment}") → "production"
   */
  resolveTemplate(template: string, sessionId?: string): string {
    if (!template) return template;

    // First resolve square brackets (UUID variables)
    let resolved = this.resolveSquareBrackets(template, sessionId);

    // Then resolve curly brackets (datasource variables)
    resolved = this.resolveCurlyBrackets(resolved);

    return resolved;
  }

  /**
   * Resolve square bracket variables: [variable] → variable-UUID
   *
   * If sessionId is provided, uses consistent UUIDs for the session.
   * This is critical for STOMP where listener and trigger topics must match.
   *
   * @param template String containing [variable] patterns
   * @param sessionId Optional session ID for consistency
   * @returns Resolved string
   */
  resolveSquareBrackets(template: string, sessionId?: string): string {
    return template.replace(/\[([^\]]+)\]/g, (_, variable) => {
      const cacheKey = sessionId ? `${sessionId}:${variable}` : variable;

      // Check if we already have a UUID for this variable in this session
      if (sessionId && this.uuidCache.has(cacheKey)) {
        return this.uuidCache.get(cacheKey)!;
      }

      // Generate new UUID
      const uuid = uuidv4();
      const resolved = `${variable}-${uuid}`;

      // Cache it if session-based
      if (sessionId) {
        this.uuidCache.set(cacheKey, resolved);
      }

      return resolved;
    });
  }

  /**
   * Resolve curly bracket variables: {datasource.variable} → value
   *
   * Looks up values from datasources like AppVariables.
   * Path format: {datasourceName.variableName} or {datasourceName.nested.path}
   *
   * @param template String containing {datasource.variable} patterns
   * @returns Resolved string
   *
   * @example
   * resolveTemplate("{AppVariables.ds.Environment}") → "production"
   * resolveTemplate("{AppVariables.ds.ConnectionString}") → "ws://prod-server:8080"
   */
  resolveCurlyBrackets(template: string): string {
    return template.replace(/\{([^}]+)\}/g, (match, path) => {
      try {
        // Parse the path (e.g., "AppVariables.ds.ConnectionString")
        const parts = path.split('.');

        if (parts.length < 2) {
          logger.warn(`Invalid variable path: ${path}`, null, 'TemplateResolver');
          return match; // Return unchanged if invalid format
        }

        // Get the value from the datasource
        const value = this.getVariableValue(path);

        return value !== undefined ? String(value) : match;
      } catch (error) {
        logger.error(`Error resolving variable ${path}`, error, 'TemplateResolver');
        return match; // Return unchanged on error
      }
    });
  }

  /**
   * Get variable value from a datasource
   *
   * Currently checks localStorage for persisted variables.
   * In the future, this can be extended to query AppVariables provider directly.
   *
   * @param path Full variable path (e.g., "AppVariables.ds.Environment")
   * @returns Variable value or undefined
   */
  private getVariableValue(path: string): any {
    const parts = path.split('.');

    if (parts.length < 2) {
      return undefined;
    }

    // Extract datasource name (e.g., "AppVariables.ds")
    const datasourceName = parts.slice(0, 2).join('.');

    // Extract variable name (rest of path)
    const variableName = parts.slice(2).join('.');

    // Check localStorage for persisted variables
    const storageKey = `stern_variables_${datasourceName}`;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const variables = JSON.parse(stored);

        // Support nested paths (e.g., "config.url")
        let value = variables;
        for (const part of variableName.split('.')) {
          if (value && typeof value === 'object' && part in value) {
            value = value[part];
          } else {
            return undefined;
          }
        }

        return value;
      }
    } catch (error) {
      logger.error(`Error reading variables from ${datasourceName}`, error, 'TemplateResolver');
    }

    return undefined;
  }

  /**
   * Clear UUID cache for a session
   *
   * Call this when a session ends to free memory.
   *
   * @param sessionId Session ID to clear
   */
  clearSession(sessionId: string): void {
    const keysToDelete: string[] = [];

    this.uuidCache.forEach((_, key) => {
      if (key.startsWith(`${sessionId}:`)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.uuidCache.delete(key));
  }

  /**
   * Clear all cached UUIDs
   */
  clearAllCache(): void {
    this.uuidCache.clear();
  }

  /**
   * Set a variable value (for AppVariables provider to use)
   *
   * @param datasourceName Datasource name (e.g., "AppVariables.ds")
   * @param variableName Variable name (e.g., "Environment")
   * @param value Variable value
   */
  static setVariableValue(datasourceName: string, variableName: string, value: any): void {
    const storageKey = `stern_variables_${datasourceName}`;

    try {
      const stored = localStorage.getItem(storageKey);
      const variables = stored ? JSON.parse(stored) : {};

      // Support nested paths
      const parts = variableName.split('.');
      let current = variables;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }

      current[parts[parts.length - 1]] = value;

      localStorage.setItem(storageKey, JSON.stringify(variables));
    } catch (error) {
      logger.error(`Error setting variable ${variableName} in ${datasourceName}`, error, 'TemplateResolver');
    }
  }

  /**
   * Get all variables for a datasource
   *
   * @param datasourceName Datasource name (e.g., "AppVariables.ds")
   * @returns Record of all variables
   */
  static getVariables(datasourceName: string): Record<string, any> {
    const storageKey = `stern_variables_${datasourceName}`;

    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      logger.error(`Error reading variables from ${datasourceName}`, error, 'TemplateResolver');
      return {};
    }
  }
}

// Export singleton instance
export const templateResolver = TemplateResolver.getInstance();
