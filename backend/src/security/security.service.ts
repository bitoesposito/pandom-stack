import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../common/common.interface';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { SecurityLogsResponseDto, SessionsResponseDto, DownloadDataResponseDto } from './security.dto';
import { AuditService, AuditEventType } from '../common/services/audit.service';
import { Request, Response } from 'express';
import { UserRole } from '../auth/auth.interface';

// In-memory storage for download data (in production, use Redis or database)
interface DownloadData {
  userId: string;
  data: any;
  expiresAt: Date;
}

/**
 * Service handling security-related business logic
 * Manages security logs, sessions, and data privacy operations
 */
@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly downloadDataStorage = new Map<string, DownloadData>();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly auditService: AuditService,
  ) { }

  /**
   * Get user security logs
   * @param userId - User ID
   * @param req - Request object for IP and User Agent
   * @returns Promise<ApiResponseDto<SecurityLogsResponseDto>>
   */
  async getSecurityLogs(userId: string, req?: Request): Promise<ApiResponseDto<SecurityLogsResponseDto>> {
    try {
      this.logger.log('Getting security logs for user', { userId });

      // Verify user exists
      const user = await this.userRepository.findOne({
        where: { uuid: userId }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get audit logs for this user
      const auditLogs = await this.auditService.getUserAuditLogs(userId, 50);

      // Transform audit logs to security logs format
      const securityLogs = auditLogs.map(log => ({
        id: log.id || `log_${Date.now()}_${Math.random()}`,
        action: log.event_type,
        ip_address: log.ip_address || 'Unknown',
        user_agent: log.user_agent || 'Unknown',
        timestamp: typeof log.timestamp === 'string' ? log.timestamp : log.timestamp.toISOString(),
        success: log.status === 'SUCCESS',
        details: log.details || {}
      }));

      const response: SecurityLogsResponseDto = {
        logs: securityLogs,
        pagination: {
          page: 1,
          limit: 50,
          total: securityLogs.length,
          total_pages: 1
        }
      };

      this.logger.log('Security logs retrieved successfully', { userId, logCount: securityLogs.length });
      
      return ApiResponseDto.success(response, 'Security logs retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get security logs', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user sessions
   * @param userId - User ID
   * @param req - Request object for IP and User Agent
   * @returns Promise<ApiResponseDto<SessionsResponseDto>>
   */
  async getSessions(userId: string, req?: Request): Promise<ApiResponseDto<SessionsResponseDto>> {
    try {
      this.logger.log('Getting user sessions', { userId });

      // Verify user exists
      const user = await this.userRepository.findOne({
        where: { uuid: userId }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Extract IP and User Agent from request
      const clientIp = req?.ip || req?.connection?.remoteAddress || req?.headers['x-forwarded-for'] || 'Unknown';
      const userAgent = req?.headers['user-agent'] || 'Unknown';

      // Get current active sessions (refresh tokens)
      const sessions: any[] = [];

      // Add current refresh token if exists
      if (user.refresh_token && user.refresh_token_expires && user.refresh_token_expires > new Date()) {
        sessions.push({
          id: 'current',
          device: 'Current Session',
          ip_address: clientIp,
          user_agent: userAgent,
          created_at: user.last_login_at?.toISOString() || new Date().toISOString(),
          expires_at: user.refresh_token_expires.toISOString(),
          is_active: true
        });
      }

      // Get recent login activities from audit logs
      const loginLogs = await this.auditService.getAuditLogsByType(AuditEventType.USER_LOGIN_SUCCESS, 10);

      // Add recent login sessions
      loginLogs.forEach((log, index) => {
        if (log.user_id === userId && index > 0) { // Skip current session
          sessions.push({
            id: `session_${log.id || index}`,
            device: log.details?.device || 'Unknown Device',
            ip_address: log.ip_address || 'Unknown',
            user_agent: log.user_agent || 'Unknown',
            created_at: typeof log.timestamp === 'string' ? log.timestamp : log.timestamp.toISOString(),
            expires_at: new Date((typeof log.timestamp === 'string' ? new Date(log.timestamp) : log.timestamp).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            is_active: false
          });
        }
      });

      const response: SessionsResponseDto = {
        sessions: sessions
      };

      this.logger.log('User sessions retrieved successfully', { userId, sessionCount: sessions.length });
      
      return ApiResponseDto.success(response, 'Sessions retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get user sessions', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Download user data (GDPR compliance)
   * @param userId - User ID
   * @returns Promise<ApiResponseDto<DownloadDataResponseDto>>
   */
  async downloadData(userId: string): Promise<ApiResponseDto<DownloadDataResponseDto>> {
    try {
      this.logger.log('Initiating data download for user', { userId });

      // Verify user exists
      const user = await this.userRepository.findOne({
        where: { uuid: userId },
        relations: ['profile']
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Prepare user data for export
      const userData = {
        user: {
          uuid: user.uuid,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          is_verified: user.is_verified,
          is_configured: user.is_configured,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login_at: user.last_login_at
        },
        profile: user.profile ? {
          uuid: user.profile.uuid,
          display_name: user.profile.display_name,
          tags: user.profile.tags,
          metadata: user.profile.metadata,
          created_at: user.profile.created_at,
          updated_at: user.profile.updated_at
        } : null,
        security_logs: await this.getUserSecurityLogsForExport(userId),
        export_info: {
          exported_at: new Date().toISOString(),
          exported_by: userId,
          format: 'json'
        }
      };

      // Generate unique timestamp for the file
      const timestamp = Date.now();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store the data in memory (in production, use Redis or database)
      const downloadKey = `${userId}-${timestamp}`;
      this.downloadDataStorage.set(downloadKey, {
        userId,
        data: userData,
        expiresAt
      });

      // Use environment variable for base URL
      const baseUrl = process.env.BE_URL || 'http://localhost:3000';
      const downloadUrl = `${baseUrl}/security/downloads/user-data-${userId}-${timestamp}.json`;

      // Log the data export for audit
      await this.auditService.log({
        event_type: AuditEventType.DATA_EXPORT,
        user_id: userId,
        user_email: user.email,
        status: 'SUCCESS',
        details: {
          download_url: downloadUrl,
          expires_at: expiresAt.toISOString(),
          data_size: JSON.stringify(userData).length
        }
      });

      const response: DownloadDataResponseDto = {
        download_url: downloadUrl,
        expires_at: expiresAt.toISOString(),
        file_size: JSON.stringify(userData).length,
        format: 'json'
      };

      this.logger.log('Data download initiated successfully', { userId, downloadUrl });
      
      return ApiResponseDto.success(response, 'Data download initiated successfully');
    } catch (error) {
      this.logger.error('Failed to initiate data download', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Download user data file
   * @param userId - User ID
   * @param timestamp - File timestamp
   * @param res - Response object
   */
  async downloadUserDataFile(userId: string, timestamp: string, res: Response): Promise<void> {
    try {
      const downloadKey = `${userId}-${timestamp}`;
      const downloadData = this.downloadDataStorage.get(downloadKey);

      if (!downloadData) {
        res.status(404).json({
          message: 'Download file not found or expired',
          error: 'Not Found',
          statusCode: 404
        });
        return;
      }

      // Check if expired
      if (downloadData.expiresAt < new Date()) {
        this.downloadDataStorage.delete(downloadKey);
        res.status(410).json({
          message: 'Download file has expired',
          error: 'Gone',
          statusCode: 410
        });
        return;
      }

      // Set response headers
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}-${timestamp}.json"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Send the data
      res.json(downloadData.data);

      // Clean up the stored data after download
      this.downloadDataStorage.delete(downloadKey);

      this.logger.log('User data file downloaded successfully', { userId, timestamp });
    } catch (error) {
      this.logger.error('Failed to download user data file', { userId, timestamp, error: error.message });
      res.status(500).json({
        message: 'Internal server error',
        error: 'Internal Server Error',
        statusCode: 500
      });
    }
  }

  /**
   * Delete user account
   * @param userId - User ID
   * @returns Promise<ApiResponseDto<null>>
   */
  async deleteAccount(userId: string): Promise<ApiResponseDto<null>> {
    try {
      this.logger.log('Deleting user account', { userId });

      // Verify user exists
      const user = await this.userRepository.findOne({
        where: { uuid: userId },
        relations: ['profile']
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user is admin and if it's the last admin
      if (user.role === UserRole.admin) {
        const adminCount = await this.userRepository.count({
          where: { role: UserRole.admin }
        });

        this.logger.log('Checking admin deletion safety', { 
          userId, 
          userEmail: user.email, 
          adminCount, 
          isLastAdmin: adminCount <= 1 
        });

        if (adminCount <= 1) {
          this.logger.warn('Attempted to delete the last admin user', { 
            userId, 
            userEmail: user.email, 
            adminCount 
          });
          
          // Log the failed deletion attempt for audit
          await this.auditService.log({
            event_type: AuditEventType.SUSPICIOUS_ACTIVITY,
            user_id: userId,
            user_email: user.email,
            status: 'WARNING',
            details: {
              activity: 'Attempted to delete last admin user',
              admin_count: adminCount,
              timestamp: new Date().toISOString()
            }
          });
          
          throw new BadRequestException('Cannot delete the last admin user. At least one admin must remain in the system.');
        }

        this.logger.log('Admin user deletion check passed', { userId, adminCount });
      }

      // Log the account deletion attempt
      await this.auditService.log({
        event_type: AuditEventType.USER_DELETED,
        user_id: userId,
        user_email: user.email,
        status: 'SUCCESS',
        details: {
          deletion_requested_at: new Date().toISOString(),
          account_age_days: Math.floor((Date.now() - user.created_at.getTime()) / (1000 * 60 * 60 * 24))
        }
      });

      // Use a transaction to handle foreign key constraints properly
      await this.userRepository.manager.transaction(async (transactionalEntityManager) => {
        // First, update the user to remove the profile reference
        await transactionalEntityManager
          .createQueryBuilder()
          .update('auth_users')
          .set({ profile_uuid: null })
          .where('uuid = :userId', { userId })
          .execute();

        // Then delete the profile if it exists
        if (user.profile) {
          await transactionalEntityManager
            .createQueryBuilder()
            .delete()
            .from('user_profiles')
            .where('uuid = :profileUuid', { profileUuid: user.profile.uuid })
            .execute();
          
          this.logger.log('User profile deleted', { userId, profileUuid: user.profile.uuid });
        }

        // Finally delete the user
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('auth_users')
          .where('uuid = :userId', { userId })
          .execute();
      });
      
      this.logger.log('User account deleted successfully', { userId, email: user.email });
      
      return ApiResponseDto.success(null, 'Account deleted successfully');
    } catch (error) {
      this.logger.error('Failed to delete user account', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user security logs for data export
   * @param userId - User ID
   * @returns Promise<any[]>
   */
  private async getUserSecurityLogsForExport(userId: string): Promise<any[]> {
    try {
      // Get all audit logs for this user
      const auditLogs = await this.auditService.getUserAuditLogs(userId, 1000);

      return auditLogs.map(log => ({
        id: log.id,
        event_type: log.event_type,
        timestamp: typeof log.timestamp === 'string' ? log.timestamp : log.timestamp.toISOString(),
        status: log.status,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        details: log.details
      }));
    } catch (error) {
      this.logger.error('Failed to get user security logs for export', { userId, error: error.message });
      return [];
    }
  }
} 