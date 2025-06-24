import { Injectable, Logger } from '@nestjs/common';

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class LoggerService {
  private readonly logger = new Logger('AppLogger');

  private formatLogEntry(level: LogLevel, message: string, context?: string, metadata?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
    };
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.INFO, message, context, metadata);
    this.logger.log(JSON.stringify(entry));
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.WARN, message, context, metadata);
    this.logger.warn(JSON.stringify(entry));
  }

  error(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.ERROR, message, context, metadata);
    this.logger.error(JSON.stringify(entry));
  }

  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.DEBUG, message, context, metadata);
    this.logger.debug(JSON.stringify(entry));
  }
} 