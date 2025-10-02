/**
 * Frontend Logger
 * Centralized logging utility for the frontend application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  context?: string;
}

class Logger {
  private isDevelopment: boolean;
  private minLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.minLevel = import.meta.env.VITE_LOG_LEVEL || (this.isDevelopment ? 'debug' : 'warn');
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown, context?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context
    };

    // Store in memory (circular buffer)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Only output to console in development
    if (this.isDevelopment) {
      const contextStr = context ? `[${context}]` : '';
      const prefix = `${entry.timestamp} ${level.toUpperCase()} ${contextStr}`;

      switch (level) {
        case 'debug':
          // eslint-disable-next-line no-console
          console.debug(prefix, message, data || '');
          break;
        case 'info':
          // eslint-disable-next-line no-console
          console.info(prefix, message, data || '');
          break;
        case 'warn':
          // eslint-disable-next-line no-console
          console.warn(prefix, message, data || '');
          break;
        case 'error':
          // eslint-disable-next-line no-console
          console.error(prefix, message, data || '');
          break;
      }
    }
  }

  debug(message: string, data?: unknown, context?: string): void {
    if (this.shouldLog('debug')) {
      this.formatMessage('debug', message, data, context);
    }
  }

  info(message: string, data?: unknown, context?: string): void {
    if (this.shouldLog('info')) {
      this.formatMessage('info', message, data, context);
    }
  }

  warn(message: string, data?: unknown, context?: string): void {
    if (this.shouldLog('warn')) {
      this.formatMessage('warn', message, data, context);
    }
  }

  error(message: string, error?: unknown, context?: string): void {
    if (this.shouldLog('error')) {
      this.formatMessage('error', message, error, context);

      // In production, send to error reporting service
      if (!this.isDevelopment && import.meta.env.VITE_ERROR_REPORTING_URL) {
        this.reportError(message, error, context);
      }
    }
  }

  private async reportError(message: string, error?: unknown, context?: string): Promise<void> {
    try {
      const errorData = {
        message,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      await fetch(import.meta.env.VITE_ERROR_REPORTING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      });
    } catch (reportError) {
      // Silently fail if error reporting fails
    }
  }

  /**
   * Get recent logs (useful for debugging or support)
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Export logs as JSON (for bug reports)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const debug = (message: string, data?: unknown, context?: string) =>
  logger.debug(message, data, context);

export const info = (message: string, data?: unknown, context?: string) =>
  logger.info(message, data, context);

export const warn = (message: string, data?: unknown, context?: string) =>
  logger.warn(message, data, context);

export const error = (message: string, errorData?: unknown, context?: string) =>
  logger.error(message, errorData, context);

export default logger;
