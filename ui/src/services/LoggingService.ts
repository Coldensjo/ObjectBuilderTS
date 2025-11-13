/**
 * LoggingService - Centralized logging service for the application
 * Captures all errors, warnings, and debug information
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface LogEntry {
  id: number;
  timestamp: Date;
  level: LogLevel;
  message: string;
  stack?: string;
  source?: string;
  context?: any;
}

type LogListener = (entry: LogEntry) => void;

class LoggingService {
  private static instance: LoggingService | null = null;
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private nextId: number = 0;
  private maxLogs: number = 10000; // Keep last 10k logs

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  private addLog(level: LogLevel, message: string, stack?: string, source?: string, context?: any): void {
    const entry: LogEntry = {
      id: this.nextId++,
      timestamp: new Date(),
      level,
      message,
      stack,
      source,
      context
    };

    this.logs.push(entry);
    
    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        // Prevent logging errors from causing infinite loops
        console.error('Error in log listener:', error);
      }
    });

    // Also send to backend if available
    this.sendToBackend(level, message, stack, source);
  }

  private async sendToBackend(level: LogLevel, message: string, stack?: string, source?: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        // Map frontend log levels to backend log levels
        const levelMap: { [key: string]: number } = {
          'debug': 2,
          'info': 4,
          'warn': 6,
          'error': 8,
          'fatal': 1000
        };

        const backendLevel = levelMap[level] || 4;
        
        // Send as LogCommand to backend
        await window.electronAPI.sendCommand({
          type: 'LogCommand',
          level: backendLevel,
          message,
          stack,
          source,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      // Silently fail - don't log logging errors
    }
  }

  public debug(message: string, source?: string, context?: any): void {
    this.addLog(LogLevel.DEBUG, message, undefined, source, context);
  }

  public info(message: string, source?: string, context?: any): void {
    this.addLog(LogLevel.INFO, message, undefined, source, context);
  }

  public warn(message: string, source?: string, context?: any): void {
    this.addLog(LogLevel.WARN, message, undefined, source, context);
  }

  public error(message: string, error?: Error | any, source?: string, context?: any): void {
    let stack: string | undefined;
    let errorMessage = message;

    if (error) {
      if (error instanceof Error) {
        stack = error.stack;
        errorMessage = errorMessage ? `${message}: ${error.message}` : error.message;
      } else if (typeof error === 'string') {
        errorMessage = errorMessage ? `${message}: ${error}` : error;
      } else {
        errorMessage = errorMessage ? `${message}: ${JSON.stringify(error)}` : JSON.stringify(error);
      }
    }

    this.addLog(LogLevel.ERROR, errorMessage, stack, source, context);
  }

  public fatal(message: string, error?: Error | any, source?: string, context?: any): void {
    let stack: string | undefined;
    let errorMessage = message;

    if (error) {
      if (error instanceof Error) {
        stack = error.stack;
        errorMessage = errorMessage ? `${message}: ${error.message}` : error.message;
      } else if (typeof error === 'string') {
        errorMessage = errorMessage ? `${message}: ${error}` : error;
      } else {
        errorMessage = errorMessage ? `${message}: ${JSON.stringify(error)}` : JSON.stringify(error);
      }
    }

    this.addLog(LogLevel.FATAL, errorMessage, stack, source, context);
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getLogs(filter?: { level?: LogLevel; source?: string }): LogEntry[] {
    let filtered = this.logs;

    if (filter) {
      if (filter.level) {
        filtered = filtered.filter(log => log.level === filter.level);
      }
      if (filter.source) {
        filtered = filtered.filter(log => log.source === filter.source);
      }
    }

    return filtered;
  }

  public clear(): void {
    this.logs = [];
    this.nextId = 0;
  }

  public getLogCount(): number {
    return this.logs.length;
  }
}

// Export singleton instance
export const logger = LoggingService.getInstance();

// Helper function to get source from stack trace
export function getSourceFromStack(stack?: string): string | undefined {
  if (!stack) return undefined;

  // Try to extract file name and line number from stack trace
  const lines = stack.split('\n');
  for (const line of lines) {
    // Match patterns like: at ComponentName (file:///path/to/file.tsx:123:45)
    const match = line.match(/at\s+(?:\w+\.)?(\w+)\s+\(([^:]+):(\d+):(\d+)\)/);
    if (match) {
      const [, functionName, filePath, line, col] = match;
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
      return `${fileName}:${line}`;
    }
  }

  return undefined;
}

