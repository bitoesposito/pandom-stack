import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Log levels for application logging
 * 
 * Defines the available log levels for structured logging.
 * Each level represents a different severity of log message.
 */
export enum LogLevel {
  /** Informational messages for general application flow */
  INFO = 'INFO',
  /** Warning messages for potential issues */
  WARN = 'WARN',
  /** Error messages for application errors */
  ERROR = 'ERROR',
  /** Debug messages for development and troubleshooting */
  DEBUG = 'DEBUG',
}

/**
 * Interface for structured log entries
 * 
 * Defines the structure of log entries written to files.
 * Provides consistent formatting for all log messages.
 */
export interface LogEntry {
  /** ISO timestamp of when the log was created */
  timestamp: string;
  /** Log level indicating severity */
  level: LogLevel;
  /** Main log message */
  message: string;
  /** Optional context for categorizing logs */
  context?: string;
  /** Optional metadata for additional information */
  metadata?: Record<string, any>;
}

/**
 * Logger Service
 * 
 * Provides centralized logging functionality for the application.
 * Implements both console and file-based logging with structured format.
 * 
 * Features:
 * - Multiple log levels (INFO, WARN, ERROR, DEBUG)
 * - Structured JSON logging
 * - File-based log persistence
 * - Context and metadata support
 * - Automatic log directory creation
 * 
 * Log Storage:
 * - Logs are stored in 'logs/log.txt' file
 * - Each log entry is a JSON object
 * - Automatic directory creation if not exists
 * 
 * Usage:
 * - Injected into other services for logging
 * - Provides consistent logging across the application
 * - Supports structured logging for better analysis
 * 
 * @example
 * // Basic usage
 * this.loggerService.info('User logged in', 'AuthService', { userId: '123' });
 * 
 * @example
 * // Error logging
 * this.loggerService.error('Database connection failed', 'DatabaseService', { error: 'Connection timeout' });
 */
@Injectable()
export class LoggerService {
  private readonly logger = new Logger('AppLogger');
  private readonly logFilePath = path.join(process.cwd(), 'logs', 'log.txt');

  constructor() {
    // Create logs directory if it doesn't exist
    const logsDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  // ============================================================================
  // PRIVATE UTILITY METHODS
  // ============================================================================

  /**
   * Format log entry with structured data
   * 
   * Creates a standardized log entry object with timestamp and metadata.
   * Ensures consistent formatting across all log levels.
   * 
   * @param level - Log level for the entry
   * @param message - Main log message
   * @param context - Optional context for categorizing the log
   * @param metadata - Optional additional data for the log entry
   * @returns Formatted log entry object
   */
  private formatLogEntry(
    level: LogLevel, 
    message: string, 
    context?: string, 
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
    };
  }

  /**
   * Write log entry to file
   * 
   * Appends a log entry to the log file in JSON format.
   * Each entry is written on a new line for easy parsing.
   * 
   * @param entry - Log entry to write to file
   */
  private writeToFile(entry: LogEntry) {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.logFilePath, line, { encoding: 'utf8' });
  }

  // ============================================================================
  // PUBLIC LOGGING METHODS
  // ============================================================================

  /**
   * Log informational message
   * 
   * Used for general application flow and successful operations.
   * Provides visibility into normal application behavior.
   * 
   * @param message - Informational message to log
   * @param context - Optional context for categorizing the log
   * @param metadata - Optional additional data for the log entry
   * 
   * @example
   * this.loggerService.info('User registration successful', 'AuthService', { email: 'user@example.com' });
   */
  info(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.INFO, message, context, metadata);
    this.logger.log(JSON.stringify(entry));
    this.writeToFile(entry);
  }

  /**
   * Log warning message
   * 
   * Used for potential issues that don't stop the application.
   * Indicates situations that should be monitored.
   * 
   * @param message - Warning message to log
   * @param context - Optional context for categorizing the log
   * @param metadata - Optional additional data for the log entry
   * 
   * @example
   * this.loggerService.warn('Database connection slow', 'DatabaseService', { responseTime: 5000 });
   */
  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.WARN, message, context, metadata);
    this.logger.warn(JSON.stringify(entry));
    this.writeToFile(entry);
  }

  /**
   * Log error message
   * 
   * Used for application errors and exceptions.
   * Indicates issues that need immediate attention.
   * 
   * @param message - Error message to log
   * @param context - Optional context for categorizing the log
   * @param metadata - Optional additional data for the log entry
   * 
   * @example
   * this.loggerService.error('Database connection failed', 'DatabaseService', { error: 'Connection timeout' });
   */
  error(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.ERROR, message, context, metadata);
    this.logger.error(JSON.stringify(entry));
    this.writeToFile(entry);
  }

  /**
   * Log debug message
   * 
   * Used for development and troubleshooting information.
   * Provides detailed information for debugging purposes.
   * 
   * @param message - Debug message to log
   * @param context - Optional context for categorizing the log
   * @param metadata - Optional additional data for the log entry
   * 
   * @example
   * this.loggerService.debug('Processing user request', 'UserService', { requestId: 'abc123', userId: '456' });
   */
  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.DEBUG, message, context, metadata);
    this.logger.debug(JSON.stringify(entry));
    this.writeToFile(entry);
  }
} 