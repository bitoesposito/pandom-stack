import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export enum AuditEventType {
  // Authentication events
  USER_LOGIN_SUCCESS = 'USER_LOGIN_SUCCESS',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  USER_VERIFY_EMAIL = 'USER_VERIFY_EMAIL',
  USER_RESET_PASSWORD = 'USER_RESET_PASSWORD',
  USER_CHANGE_PASSWORD = 'USER_CHANGE_PASSWORD',
  
  // Security events
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  
  // Data access events
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_DOWNLOAD = 'DATA_DOWNLOAD',
  DATA_EXPORT = 'DATA_EXPORT',
  
  // Administrative events
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',
  USER_DELETED = 'USER_DELETED',
  
  // Session events
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_REVOKED = 'SESSION_REVOKED',
}

export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  event_type: AuditEventType;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  resource?: string;
  action?: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly auditLogPath = path.join(process.cwd(), 'logs', 'audit.log');

  constructor() {
    // Crea la directory logs se non esiste
    const logsDir = path.dirname(this.auditLogPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...event,
      timestamp: new Date(),
    };

    // Log to file
    this.writeToFile(auditEntry);
    
    // Log to console for development
    this.logger.log(`AUDIT: ${event.event_type} - User: ${event.user_email || 'anonymous'} - Status: ${event.status}`);
  }

  /**
   * Log successful login
   */
  async logLoginSuccess(userId: string, userEmail: string, ipAddress?: string, userAgent?: string, sessionId?: string): Promise<void> {
    await this.log({
      event_type: AuditEventType.USER_LOGIN_SUCCESS,
      user_id: userId,
      user_email: userEmail,
      ip_address: ipAddress,
      user_agent: userAgent,
      session_id: sessionId,
      status: 'SUCCESS',
      details: {
        login_method: 'password',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log failed login attempt
   */
  async logLoginFailed(email: string, ipAddress?: string, userAgent?: string, reason?: string): Promise<void> {
    await this.log({
      event_type: AuditEventType.USER_LOGIN_FAILED,
      user_email: email,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: 'FAILED',
      details: {
        reason: reason || 'Invalid credentials',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log user logout
   */
  async logLogout(userId: string, userEmail: string, sessionId?: string): Promise<void> {
    await this.log({
      event_type: AuditEventType.USER_LOGOUT,
      user_id: userId,
      user_email: userEmail,
      session_id: sessionId,
      status: 'SUCCESS',
      details: {
        logout_method: 'user_initiated',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log password reset
   */
  async logPasswordReset(userId: string, userEmail: string, ipAddress?: string): Promise<void> {
    await this.log({
      event_type: AuditEventType.USER_RESET_PASSWORD,
      user_id: userId,
      user_email: userEmail,
      ip_address: ipAddress,
      status: 'SUCCESS',
      details: {
        reset_method: 'email_token',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(userId: string, userEmail: string, activity: string, ipAddress?: string): Promise<void> {
    await this.log({
      event_type: AuditEventType.SUSPICIOUS_ACTIVITY,
      user_id: userId,
      user_email: userEmail,
      ip_address: ipAddress,
      status: 'WARNING',
      details: {
        activity,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log brute force attempt
   */
  async logBruteForceAttempt(email: string, ipAddress: string, attemptCount: number): Promise<void> {
    await this.log({
      event_type: AuditEventType.BRUTE_FORCE_ATTEMPT,
      user_email: email,
      ip_address: ipAddress,
      status: 'WARNING',
      details: {
        attempt_count: attemptCount,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log data access
   */
  async logDataAccess(userId: string, userEmail: string, resource: string, action: string, ipAddress?: string): Promise<void> {
    await this.log({
      event_type: AuditEventType.DATA_ACCESS,
      user_id: userId,
      user_email: userEmail,
      ip_address: ipAddress,
      resource,
      action,
      status: 'SUCCESS',
      details: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log administrative action
   */
  async logAdminAction(adminId: string, adminEmail: string, action: string, targetUserId?: string, targetUserEmail?: string): Promise<void> {
    await this.log({
      event_type: AuditEventType.USER_ROLE_CHANGED,
      user_id: adminId,
      user_email: adminEmail,
      status: 'SUCCESS',
      details: {
        action,
        target_user_id: targetUserId,
        target_user_email: targetUserEmail,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Write audit entry to file
   */
  private writeToFile(entry: AuditLogEntry): void {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.auditLogPath, line, { encoding: 'utf8' });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId: string, limit: number = 100): Promise<AuditLogEntry[]> {
    const logs = fs.readFileSync(this.auditLogPath, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .filter((entry: AuditLogEntry) => entry.user_id === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return logs;
  }

  /**
   * Get audit logs by event type
   */
  async getAuditLogsByType(eventType: AuditEventType, limit: number = 100): Promise<AuditLogEntry[]> {
    const logs = fs.readFileSync(this.auditLogPath, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .filter((entry: AuditLogEntry) => entry.event_type === eventType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return logs;
  }
} 