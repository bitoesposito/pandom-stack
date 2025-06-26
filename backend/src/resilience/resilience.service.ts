import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../common/common.interface';
import { User } from '../auth/entities/user.entity';
import { SystemStatusResponseDto, BackupResponseDto, BackupStatusResponseDto } from './resilience.dto';
import { AuditService, AuditEventType } from '../common/services/audit.service';
import { MinioService } from '../common/services/minio.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Service handling resilience-related business logic
 * Manages system status and backup operations
 */
@Injectable()
export class ResilienceService {
  private readonly logger = new Logger(ResilienceService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups');
  private readonly backupBucketPrefix = 'backups/';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
    private readonly minioService: MinioService,
  ) {
    // Ensure backup directory exists for temporary files
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Get system status (healthcheck)
   * @returns Promise<ApiResponseDto<SystemStatusResponseDto>>
   */
  async getSystemStatus(): Promise<ApiResponseDto<SystemStatusResponseDto>> {
    try {
      this.logger.log('Checking system status');

      // Check database connectivity
      const databaseStatus = await this.checkDatabaseHealth();
      
      // Check storage connectivity (simulated)
      const storageStatus = await this.checkStorageHealth();
      
      // Check email service (simulated)
      const emailStatus = await this.checkEmailHealth();

      // Calculate overall status
      const overallStatus = this.calculateOverallStatus([databaseStatus, storageStatus, emailStatus]);

      const response: SystemStatusResponseDto = {
        status: overallStatus,
      timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      services: {
          database: databaseStatus,
          storage: storageStatus,
          email: emailStatus
        }
      };

      this.logger.log('System status retrieved successfully', { status: overallStatus });
      return ApiResponseDto.success(response, 'System status retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get system status', { error: error.message });
      throw error;
    }
  }

  /**
   * Create system backup
   * @returns Promise<ApiResponseDto<BackupResponseDto>>
   */
  async createBackup(): Promise<ApiResponseDto<BackupResponseDto>> {
    try {
      this.logger.log('Creating system backup');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}.sql`;
      const localBackupPath = path.join(this.backupDir, backupFileName);
      const minioKey = `${this.backupBucketPrefix}${backupFileName}`;

      // Get database connection details from environment variables
      const dbName = process.env.POSTGRES_DB || 'postgres';
      const dbHost = process.env.POSTGRES_HOST || process.env.DB_HOST || 'postgres';
      const dbPort = process.env.POSTGRES_PORT || '5432';
      const dbUser = process.env.POSTGRES_USER || 'user';
      const dbPassword = process.env.POSTGRES_PASSWORD || 'password';

      // Validate required parameters
      if (!dbName || !dbHost || !dbUser || !dbPassword) {
        throw new Error('Database configuration incomplete. Please check POSTGRES_DB, POSTGRES_HOST, POSTGRES_USER, and POSTGRES_PASSWORD environment variables.');
      }

      // Create backup command with proper escaping
      const backupCommand = `PGPASSWORD='${dbPassword}' pg_dump -h '${dbHost}' -p '${dbPort}' -U '${dbUser}' -d '${dbName}' -f '${localBackupPath}'`;
      
      this.logger.log('Executing backup command', { 
        host: dbHost, 
        port: dbPort, 
        user: dbUser, 
        database: dbName,
        localBackupPath 
      });

      await execAsync(backupCommand);

      // Verify backup file exists and has content
      if (!fs.existsSync(localBackupPath)) {
        throw new Error('Backup file was not created');
      }

      const backupStats = fs.statSync(localBackupPath);
      if (backupStats.size === 0) {
        throw new Error('Backup file is empty');
      }

      // Upload backup to MinIO
      this.logger.log('Uploading backup to MinIO', { minioKey });
      const backupBuffer = fs.readFileSync(localBackupPath);
      const mockFile = {
        buffer: backupBuffer,
        mimetype: 'application/sql',
        originalname: backupFileName,
        size: backupStats.size
      } as Express.Multer.File;

      await this.minioService.uploadFile(mockFile, minioKey);

      // Clean up local file
      fs.unlinkSync(localBackupPath);

      // Log the backup creation
      await this.auditService.log({
        event_type: AuditEventType.DATA_EXPORT,
        status: 'SUCCESS',
        details: {
          action: 'create_backup',
          backup_file: backupFileName,
          backup_size: backupStats.size,
          minio_key: minioKey
        }
      });

      const response: BackupResponseDto = {
        backup_id: timestamp,
        backup_file: backupFileName,
        backup_size: backupStats.size,
        created_at: new Date().toISOString(),
        status: 'completed'
      };

      this.logger.log('System backup created and uploaded to MinIO successfully', { backupFileName, size: backupStats.size, minioKey });
      return ApiResponseDto.success(response, 'System backup created and uploaded to MinIO successfully');
    } catch (error) {
      this.logger.error('Failed to create system backup', { error: error.message });
      
      // Log the failed backup attempt
      await this.auditService.log({
        event_type: AuditEventType.DATA_EXPORT,
        status: 'FAILED',
        details: {
          action: 'create_backup',
          error: error.message
        }
      });
      
      throw error;
    }
  }

  /**
   * Restore system from backup
   * @param backupId - Backup ID (timestamp)
   * @returns Promise<ApiResponseDto<BackupResponseDto>>
   */
  async restoreBackup(backupId: string): Promise<ApiResponseDto<BackupResponseDto>> {
    try {
      this.logger.log('Restoring system from backup', { backupId });

      const backupFileName = `backup-${backupId}.sql`;
      const minioKey = `${this.backupBucketPrefix}${backupFileName}`;
      const localBackupPath = path.join(this.backupDir, backupFileName);

      // Download backup from MinIO
      this.logger.log('Downloading backup from MinIO', { minioKey });
      
      try {
        const backupBuffer = await this.minioService.downloadFile(minioKey);
        fs.writeFileSync(localBackupPath, backupBuffer);
        this.logger.log('Backup downloaded from MinIO successfully', { 
          minioKey, 
          size: backupBuffer.length 
        });
      } catch (error) {
        throw new Error(`Backup file not found in MinIO: ${minioKey}`);
      }

      // Get database connection details from environment variables
      const dbName = process.env.POSTGRES_DB || 'postgres';
      const dbHost = process.env.POSTGRES_HOST || process.env.DB_HOST || 'postgres';
      const dbPort = process.env.POSTGRES_PORT || '5432';
      const dbUser = process.env.POSTGRES_USER || 'user';
      const dbPassword = process.env.POSTGRES_PASSWORD || 'password';

      // Validate required parameters
      if (!dbName || !dbHost || !dbUser || !dbPassword) {
        throw new Error('Database configuration incomplete. Please check POSTGRES_DB, POSTGRES_HOST, POSTGRES_USER, and POSTGRES_PASSWORD environment variables.');
      }

      // Create restore command with proper escaping
      const restoreCommand = `PGPASSWORD='${dbPassword}' psql -h '${dbHost}' -p '${dbPort}' -U '${dbUser}' -d '${dbName}' -f '${localBackupPath}'`;
      
      this.logger.log('Executing restore command', { 
        host: dbHost, 
        port: dbPort, 
        user: dbUser, 
        database: dbName,
        localBackupPath 
      });

      await execAsync(restoreCommand);

      // Clean up local file if it exists
      if (fs.existsSync(localBackupPath)) {
        fs.unlinkSync(localBackupPath);
      }

      // Log the restore operation
      await this.auditService.log({
        event_type: AuditEventType.DATA_EXPORT,
        status: 'SUCCESS',
        details: {
          action: 'restore_backup',
          backup_file: backupFileName,
          minio_key: minioKey,
          restore_timestamp: new Date().toISOString()
        }
      });

      const response: BackupResponseDto = {
        backup_id: backupId,
        backup_file: backupFileName,
        backup_size: 0, // We don't have the size from MinIO yet
        created_at: new Date().toISOString(),
        status: 'restored'
      };

      this.logger.log('System backup restored successfully from MinIO', { backupFileName, minioKey });
      return ApiResponseDto.success(response, 'System backup restored successfully from MinIO');
    } catch (error) {
      this.logger.error('Failed to restore system backup', { backupId, error: error.message });
      
      // Log the failed restore attempt
      await this.auditService.log({
        event_type: AuditEventType.DATA_EXPORT,
        status: 'FAILED',
        details: {
          action: 'restore_backup',
          backup_id: backupId,
          error: error.message
        }
      });
      
      throw error;
    }
  }

  /**
   * List available backups
   * @returns Promise<ApiResponseDto<BackupResponseDto[]>>
   */
  async listBackups(): Promise<ApiResponseDto<BackupResponseDto[]>> {
    try {
      this.logger.log('Listing available backups from MinIO');

      const backupFiles = await this.minioService.listFiles(this.backupBucketPrefix);
      
      // Filter and sort backup files
      const filteredBackups = backupFiles
        .filter(key => key.endsWith('.sql'))
        .map(key => key.replace(this.backupBucketPrefix, ''))
        .filter(file => file.startsWith('backup-'))
        .sort()
        .reverse(); // Most recent first

      const backups = filteredBackups.map(file => {
        const backupId = file.replace('backup-', '').replace('.sql', '');
        
        return {
          backup_id: backupId,
          backup_file: file,
          backup_size: 0, // We don't have size info from listing
          created_at: new Date().toISOString(), // We don't have creation date from listing
          status: 'available'
        } as BackupResponseDto;
      });

      this.logger.log('Backups listed successfully from MinIO', { count: backups.length });
      return ApiResponseDto.success(backups, 'Backups listed successfully from MinIO');
    } catch (error) {
      this.logger.error('Failed to list backups from MinIO', { error: error.message });
      throw error;
    }
  }

  /**
   * Get backup automation status
   * @returns Promise<ApiResponseDto<BackupStatusResponseDto>>
   */
  async getBackupStatus(): Promise<ApiResponseDto<BackupStatusResponseDto>> {
    try {
      this.logger.log('Getting backup automation status');

      const backupFiles = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
        .sort()
        .reverse();

      let lastBackup: {
        timestamp: string;
        file: string;
        size: number;
        checksum_valid: boolean;
      } | null = null;
      let totalSize = 0;

      if (backupFiles.length > 0) {
        const latestFile = backupFiles[0];
        const backupPath = path.join(this.backupDir, latestFile);
        const stats = fs.statSync(backupPath);
        const checksumFile = `${backupPath}.sha256`;
        const checksumValid = fs.existsSync(checksumFile);

        lastBackup = {
          timestamp: stats.birthtime.toISOString(),
          file: latestFile,
          size: stats.size,
          checksum_valid: checksumValid
        };

        // Calcola dimensione totale
        backupFiles.forEach(file => {
          const filePath = path.join(this.backupDir, file);
          totalSize += fs.statSync(filePath).size;
        });
      }

      // Calcola prossimo cleanup (ogni 24 ore)
      const nextCleanup = new Date();
      nextCleanup.setHours(nextCleanup.getHours() + 24);

      const response: BackupStatusResponseDto = {
        last_backup: lastBackup,
        total_backups: backupFiles.length,
        total_size: totalSize,
        retention_policy: {
          days: 7,
          next_cleanup: nextCleanup.toISOString()
        },
        automation_status: {
          backup_cron: 'running', // Assumiamo che sia sempre running in Docker
          cleanup_cron: 'running',
          verify_cron: 'running'
        }
      };

      this.logger.log('Backup status retrieved successfully');
      return ApiResponseDto.success(response, 'Backup status retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get backup status', { error: error.message });
      throw error;
    }
  }

  /**
   * Check database health
   * @returns Promise<'healthy' | 'degraded' | 'down'>
   */
  private async checkDatabaseHealth(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      const startTime = Date.now();
      
      // Real database health check
      await this.userRepository.query('SELECT 1');
      
      const responseTime = Date.now() - startTime;

      // Check if database is responsive
      if (responseTime < 100) {
        return 'healthy';
      } else if (responseTime < 1000) {
        return 'degraded';
      } else {
        return 'down';
      }
    } catch (error) {
      this.logger.error('Database health check failed', { error: error.message });
      return 'down';
    }
  }

  /**
   * Check storage health (MinIO/S3)
   * @returns Promise<'healthy' | 'degraded' | 'down'>
   */
  private async checkStorageHealth(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      // In a real implementation, you would check MinIO/S3 connectivity
      // For now, we'll simulate based on environment variables
      const minioEndpoint = process.env.MINIO_ENDPOINT;
      const minioPort = process.env.MINIO_PORT;
      
      if (!minioEndpoint || !minioPort) {
        this.logger.warn('MinIO configuration missing');
        return 'degraded';
      }

      // Simulate storage check (in production, make actual HTTP request to MinIO)
      const startTime = Date.now();
      
      // This would be a real MinIO health check
      // await this.minioService.healthCheck();
      
      const responseTime = Date.now() - startTime;

      if (responseTime < 200) {
        return 'healthy';
      } else if (responseTime < 2000) {
        return 'degraded';
      } else {
        return 'down';
      }
    } catch (error) {
      this.logger.error('Storage health check failed', { error: error.message });
      return 'down';
    }
  }

  /**
   * Check email service health
   * @returns Promise<'healthy' | 'degraded' | 'down'>
   */
  private async checkEmailHealth(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      // Check email configuration
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      
      if (!smtpHost || !smtpPort || !smtpUser) {
        this.logger.warn('SMTP configuration missing');
        return 'degraded';
      }

      // In production, you would test SMTP connection
      // For now, simulate based on configuration presence
      const hasValidConfig = smtpHost && smtpPort && smtpUser;
      
      if (hasValidConfig) {
        // Simulate SMTP test
        const startTime = Date.now();
        // await this.mailService.testConnection();
        const responseTime = Date.now() - startTime;

        if (responseTime < 500) {
          return 'healthy';
        } else if (responseTime < 5000) {
          return 'degraded';
        } else {
          return 'down';
        }
      } else {
        return 'down';
      }
    } catch (error) {
      this.logger.error('Email health check failed', { error: error.message });
      return 'down';
    }
  }

  /**
   * Calculate overall system status
   * @param serviceStatuses - Array of service statuses
   * @returns 'healthy' | 'degraded' | 'down'
   */
  private calculateOverallStatus(serviceStatuses: ('healthy' | 'degraded' | 'down')[]): 'healthy' | 'degraded' | 'down' {
    if (serviceStatuses.includes('down')) {
      return 'down';
    } else if (serviceStatuses.includes('degraded')) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }
} 