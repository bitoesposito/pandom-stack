import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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
  private readonly logFilePath = path.join(process.cwd(), 'logs', 'log.txt');

  constructor() {
    // Crea la directory logs se non esiste
    const logsDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  private formatLogEntry(level: LogLevel, message: string, context?: string, metadata?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
    };
  }

  private writeToFile(entry: LogEntry) {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.logFilePath, line, { encoding: 'utf8' });
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.INFO, message, context, metadata);
    this.logger.log(JSON.stringify(entry));
    this.writeToFile(entry);
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.WARN, message, context, metadata);
    this.logger.warn(JSON.stringify(entry));
    this.writeToFile(entry);
  }

  error(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.ERROR, message, context, metadata);
    this.logger.error(JSON.stringify(entry));
    this.writeToFile(entry);
  }

  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.DEBUG, message, context, metadata);
    this.logger.debug(JSON.stringify(entry));
    this.writeToFile(entry);
  }
} 