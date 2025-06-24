import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiResponseDto } from '../common/common.interface';
import { ResilienceService } from './resilience.service';

/**
 * Controller handling resilience-related endpoints
 * Manages system status and offline data operations
 */
@Controller('resilience')
export class ResilienceController {
    constructor(
        private readonly resilienceService: ResilienceService
    ) { }

    /**
     * System status (healthcheck)
     * GET /resilience/status
     */
    @Get('status')
    @HttpCode(HttpStatus.OK)
    async getSystemStatus(): Promise<ApiResponseDto<any>> {
        return this.resilienceService.getSystemStatus();
    }

    /**
     * Export essential data in offline format
     * GET /resilience/offline-data
     */
    @Get('offline-data')
    @HttpCode(HttpStatus.OK)
    async getOfflineData(): Promise<ApiResponseDto<any>> {
        return this.resilienceService.getOfflineData();
    }
} 