import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../common/common.interface';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { UserManagementResponseDto, SystemMetricsResponseDto, AuditLogsResponseDto } from './admin.dto';
import { AuditService, AuditEventType } from '../common/services/audit.service';
import { MetricsService } from '../common/services/metrics.service';
import { UserRole } from '../auth/auth.interface';

/**
 * Service handling admin-related business logic
 * Manages user administration, system metrics, and audit logs
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly auditService: AuditService,
    private readonly metricsService: MetricsService,
  ) { }

  /**
   * Get users for management
   * @param page - Page number
   * @param limit - Items per page
   * @param search - Search query
   * @param req - Request object
   * @returns Promise<ApiResponseDto<UserManagementResponseDto>>
   */
  async getUsers(page: number = 1, limit: number = 10, search?: string, req?: any): Promise<ApiResponseDto<UserManagementResponseDto>> {
    try {
      this.logger.log('Getting users for admin management', { page, limit, search });

      const skip = (page - 1) * limit;

      // Build query
      const query = this.userRepository.createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('user.is_active = :active', { active: true });

      if (search && search.trim() !== '') {
        query.andWhere(
          '(user.email ILIKE :search OR profile.metadata->>\'display_name\' ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      query.skip(skip).take(limit).orderBy('user.created_at', 'DESC');

      const [users, total] = await query.getManyAndCount();

      // Transform users for admin view
      const transformedUsers = users.map(user => ({
        uuid: user.uuid,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        created_at: user.created_at.toISOString(),
        last_login_at: user.last_login_at?.toISOString(),
        profile: user.profile ? {
          display_name: user.profile.metadata?.display_name
        } : undefined
      }));

      const totalPages = Math.ceil(total / limit);

      const response: UserManagementResponseDto = {
        users: transformedUsers,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages
        }
      };

      this.logger.log('Users retrieved successfully', { total, page, totalPages });
      return ApiResponseDto.success(response, 'Users retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get users', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete user account
   * @param uuid - User UUID
   * @param adminId - Admin user ID
   * @param adminEmail - Admin email
   * @param req - Request object
   * @returns Promise<ApiResponseDto<null>>
   */
  async deleteUser(uuid: string, adminId: string, adminEmail: string, req?: any): Promise<ApiResponseDto<null>> {
    try {
      this.logger.log('Deleting user account', { uuid, adminId });

      // Verify user exists
      const user = await this.userRepository.findOne({
        where: { uuid },
        relations: ['profile']
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Prevent deleting admin users
      if (user.role === UserRole.admin) {
        throw new BadRequestException('Cannot delete admin users through admin interface');
      }

      // Prevent deleting self
      if (user.uuid === adminId) {
        throw new BadRequestException('Cannot delete your own account');
      }

      // Log the deletion attempt
      const clientIp = this.getClientIp(req);
      await this.auditService.log({
        event_type: AuditEventType.USER_DELETED,
        user_id: adminId,
        user_email: adminEmail,
        ip_address: clientIp,
        status: 'SUCCESS',
        details: {
          action: 'admin_delete_user',
          target_user_id: uuid,
          target_user_email: user.email,
          timestamp: new Date().toISOString()
        }
      });

      // Use a transaction to handle foreign key constraints properly
      await this.userRepository.manager.transaction(async (transactionalEntityManager) => {
        // First, update the user to remove the profile reference
        await transactionalEntityManager
          .createQueryBuilder()
          .update('auth_users')
          .set({ profile_uuid: null })
          .where('uuid = :userId', { userId: uuid })
          .execute();

        // Then delete the profile if it exists
        if (user.profile) {
          await transactionalEntityManager
            .createQueryBuilder()
            .delete()
            .from('user_profiles')
            .where('uuid = :profileUuid', { profileUuid: user.profile.uuid })
            .execute();
        }

        // Finally delete the user
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('auth_users')
          .where('uuid = :userId', { userId: uuid })
          .execute();
      });

      this.logger.log('User deleted successfully', { uuid, adminId });
      return ApiResponseDto.success(null, 'User deleted successfully');
    } catch (error) {
      this.logger.error('Failed to delete user', { uuid, error: error.message });
      throw error;
    }
  }

  /**
   * Get client IP address from request
   * @param req - Express request object
   * @returns string - Client IP address
   */
  private getClientIp(req?: any): string {
    if (!req) return 'Unknown';
    const forwardedFor = req.headers?.['x-forwarded-for'] as string;
    const realIp = req.headers?.['x-real-ip'] as string;
    const remoteAddr = req.connection?.remoteAddress || req.socket?.remoteAddress;
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      return ips[0];
    }
    if (realIp) {
      return realIp;
    }
    if (remoteAddr) {
      return remoteAddr.replace(/^::ffff:/, '');
    }
    return 'Unknown';
  }

  /**
   * Get system metrics
   * @param req - Request object
   * @returns Promise<ApiResponseDto<SystemMetricsResponseDto>>
   */
  async getMetrics(req?: any): Promise<ApiResponseDto<SystemMetricsResponseDto>> {
    try {
      this.logger.log('Getting system metrics');

      // Get real system metrics from MetricsService
      const systemMetrics = await this.metricsService.getSystemMetrics();
      const hourlyMetrics = await this.metricsService.getHourlyMetrics();
      const alerts = await this.metricsService.getAlerts();
      
      // Get user activity metrics
      const userActivity = await this.metricsService.getUserActivityMetrics();

      // Get user statistics from database
      const totalUsers = await this.userRepository.count();
      
      // Get new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = await this.userRepository
        .createQueryBuilder('user')
        .where('user.created_at >= :today', { today })
        .getCount();

      // Transform hourly metrics to request volume format
      const requestVolume = hourlyMetrics.map(metric => ({
        hour: metric.hour,
        count: metric.requests
      }));

      const response: SystemMetricsResponseDto = {
        overview: {
          total_users: totalUsers,
          active_users: userActivity.activeUsers,
          new_users_today: newUsersToday,
          total_requests: systemMetrics.totalRequests,
          error_rate: systemMetrics.errorRate
        },
        charts: {
          user_growth: userActivity.userGrowth,
          request_volume: requestVolume
        },
        alerts: alerts
      };

      this.logger.log('System metrics retrieved successfully', {
        totalRequests: systemMetrics.totalRequests,
        errorRate: systemMetrics.errorRate,
        activeUsers: userActivity.activeUsers
      });
      
      return ApiResponseDto.success(response, 'Metrics retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get system metrics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get detailed system metrics
   * @param req - Request object
   * @returns Promise<ApiResponseDto<any>>
   */
  async getDetailedMetrics(req?: any): Promise<ApiResponseDto<any>> {
    try {
      this.logger.log('Getting detailed system metrics');

      const systemMetrics = await this.metricsService.getSystemMetrics();
      const hourlyMetrics = await this.metricsService.getHourlyMetrics();
      const alerts = await this.metricsService.getAlerts();

      const response = {
        system: systemMetrics,
        hourly: hourlyMetrics,
        alerts: alerts,
        timestamp: new Date().toISOString()
      };

      this.logger.log('Detailed metrics retrieved successfully');
      return ApiResponseDto.success(response, 'Detailed metrics retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get detailed metrics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get audit logs
   * @param page - Page number
   * @param limit - Items per page
   * @param req - Request object
   * @returns Promise<ApiResponseDto<AuditLogsResponseDto>>
   */
  async getAuditLogs(page: number = 1, limit: number = 50, req?: any): Promise<ApiResponseDto<AuditLogsResponseDto>> {
    try {
      this.logger.log('Getting audit logs', { page, limit });

      // Get all audit logs without filtering by event type
      const allLogs = await this.auditService.getAllAuditLogs();

      // Apply pagination manually
      const skip = (page - 1) * limit;
      const paginatedLogs = allLogs.slice(skip, skip + limit);
      const total = allLogs.length;
      const totalPages = Math.ceil(total / limit);

      // Transform logs for admin view
      const transformedLogs = paginatedLogs.map(log => ({
        id: log.id || `log_${Date.now()}_${Math.random()}`,
        action: log.event_type,
        user_uuid: log.user_id,
        user_email: log.user_email,
        ip_address: log.ip_address || 'Unknown',
        user_agent: log.user_agent || 'Unknown',
        timestamp: typeof log.timestamp === 'string' ? log.timestamp : log.timestamp.toISOString(),
        details: log.details
      }));

      const response: AuditLogsResponseDto = {
        logs: transformedLogs,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages
        }
      };

      this.logger.log('Audit logs retrieved successfully', { total, page, totalPages });
      return ApiResponseDto.success(response, 'Audit logs retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get audit logs', { error: error.message });
      throw error;
    }
  }
} 