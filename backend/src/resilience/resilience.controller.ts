import { Controller, Get, Post, Param, HttpCode, HttpStatus, Query } from '@nestjs/common';
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
     * List available backups with pagination
     * @Get('/backup')
     */
    @Get('backup')
    @HttpCode(HttpStatus.OK)
    async listBackups(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ): Promise<ApiResponseDto<{backups: BackupResponseDto[], pagination: {page: number, limit: number, total: number}}>> {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        return this.resilienceService.listBackups(pageNum, limitNum);
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