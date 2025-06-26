import { Controller, Get, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiResponseDto } from '../common/common.interface';
import { ResilienceService } from './resilience.service';
import { BackupResponseDto, BackupStatusResponseDto } from './resilience.dto';

/**
 * Controller for resilience-related endpoints
 * Handles system status, backup operations, and disaster recovery
 */
@Controller('resilience')
export class ResilienceController {
    constructor(
        private readonly resilienceService: ResilienceService
    ) { }

    /**
     * Get system status (healthcheck)
     * @Get('/status')
     */
    @Get('status')
    @HttpCode(HttpStatus.OK)
    async getSystemStatus(): Promise<ApiResponseDto<any>> {
        return this.resilienceService.getSystemStatus();
    }

    /**
     * Create system backup
     * @Post('/backup')
     */
    @Post('backup')
    @HttpCode(HttpStatus.CREATED)
    async createBackup(): Promise<ApiResponseDto<any>> {
        return this.resilienceService.createBackup();
    }

    /**
     * List available backups
     * @Get('/backup')
     */
    @Get('backup')
    @HttpCode(HttpStatus.OK)
    async listBackups(): Promise<ApiResponseDto<BackupResponseDto[]>> {
        return this.resilienceService.listBackups();
    }

    /**
     * Restore system from backup
     * @Post('/backup/:backupId/restore')
     */
    @Post('backup/:backupId/restore')
    @HttpCode(HttpStatus.OK)
    async restoreBackup(@Param('backupId') backupId: string): Promise<ApiResponseDto<any>> {
        return this.resilienceService.restoreBackup(backupId);
    }
} 