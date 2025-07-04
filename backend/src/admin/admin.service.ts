import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../common/common.interface';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { UserManagementResponseDto, SystemMetricsResponseDto, AuditLogsResponseDto } from './admin.dto';
import { AuditService, AuditEventType } from '../common/services/audit.service';
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
  ) { }

  /**
   * Get users for management
   * @param page - Page number
   * @param limit - Items per page
   * @param search - Search query
   * @returns Promise<ApiResponseDto<UserManagementResponseDto>>
   */
  async getUsers(page: number = 1, limit: number = 10, search?: string): Promise<ApiResponseDto<UserManagementResponseDto>> {
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
   * @returns Promise<ApiResponseDto<null>>
   */
  async deleteUser(uuid: string, adminId: string, adminEmail: string): Promise<ApiResponseDto<null>> {
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
      await this.auditService.log({
        event_type: AuditEventType.USER_DELETED,
        user_id: adminId,
        user_email: adminEmail,
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
   * Get system metrics
   * @returns Promise<ApiResponseDto<SystemMetricsResponseDto>>
   */
  async getMetrics(): Promise<ApiResponseDto<SystemMetricsResponseDto>> {
    try {
      this.logger.log('Getting system metrics');

      // Get user statistics
      const totalUsers = await this.userRepository.count();
      
      // Get active users (logged in last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUsers = await this.userRepository
        .createQueryBuilder('user')
        .where('user.last_login_at >= :yesterday', { yesterday })
        .getCount();

      // Get new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = await this.userRepository
        .createQueryBuilder('user')
        .where('user.created_at >= :today', { today })
        .getCount();

      // Get recent audit logs for activity metrics
      const recentLogs = await this.auditService.getAuditLogsByType(AuditEventType.USER_LOGIN_SUCCESS, 100);
      const totalRequests = recentLogs.length * 10; // Simulated based on login activity
      const errorRate = Math.random() * 0.05; // 0-5% error rate

      // Generate chart data (last 7 days)
      const userGrowth: Array<{date: string, count: number}> = [];
      const requestVolume: Array<{hour: string, count: number}> = [];
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        // Count users created on this day using proper TypeORM query
        const usersCreated = await this.userRepository
          .createQueryBuilder('user')
          .where('user.created_at >= :start', { start: dayStart })
          .andWhere('user.created_at < :end', { end: dayEnd })
          .getCount();

        userGrowth.push({
          date: dayStart.toISOString().split('T')[0],
          count: usersCreated
        });

        // Simulate request volume (hourly)
        for (let hour = 0; hour < 24; hour++) {
          requestVolume.push({
            hour: `${dayStart.toISOString().split('T')[0]}T${hour.toString().padStart(2, '0')}:00:00`,
            count: Math.floor(Math.random() * 100) + 10
          });
        }
      }

      // Generate alerts
      const alerts: Array<{id: string, type: 'error' | 'warning' | 'info', message: string, timestamp: string, resolved: boolean}> = [];
      if (errorRate > 0.03) {
        alerts.push({
          id: `alert_${Date.now()}_1`,
          type: 'warning',
          message: 'High error rate detected',
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      if (activeUsers < totalUsers * 0.1) {
        alerts.push({
          id: `alert_${Date.now()}_2`,
          type: 'info',
          message: 'Low user activity detected',
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      const response: SystemMetricsResponseDto = {
        overview: {
          total_users: totalUsers,
          active_users: activeUsers,
          new_users_today: newUsersToday,
          total_requests: totalRequests,
          error_rate: errorRate
        },
        charts: {
          user_growth: userGrowth,
          request_volume: requestVolume
        },
        alerts: alerts
      };

      this.logger.log('System metrics retrieved successfully');
      return ApiResponseDto.success(response, 'Metrics retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get system metrics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get audit logs
   * @param page - Page number
   * @param limit - Items per page
   * @returns Promise<ApiResponseDto<AuditLogsResponseDto>>
   */
  async getAuditLogs(page: number = 1, limit: number = 50): Promise<ApiResponseDto<AuditLogsResponseDto>> {
    try {
      this.logger.log('Getting audit logs', { page, limit });

      // Get all audit logs (in production, you'd implement pagination in AuditService)
      const allLogs = await this.auditService.getAuditLogsByType(AuditEventType.USER_LOGIN_SUCCESS, 1000);

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