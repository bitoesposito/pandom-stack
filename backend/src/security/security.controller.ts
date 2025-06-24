import { Controller, Get, Delete, Param, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponseDto } from '../common/common.interface';
import { SecurityService } from './security.service';

/**
 * Controller handling security-related endpoints
 * Manages security logs, sessions, and data privacy
 */
@Controller('security')
export class SecurityController {
    constructor(
        private readonly securityService: SecurityService
    ) { }

    /**
     * List recent activities and access
     * GET /security/logs
     */
    @Get('logs')
    @UseGuards(JwtAuthGuard)
    async getSecurityLogs(@Req() req: any): Promise<ApiResponseDto<any>> {
        return this.securityService.getSecurityLogs(req.user.uuid);
    }

    /**
     * View active sessions/tokens
     * GET /security/sessions
     */
    @Get('sessions')
    @UseGuards(JwtAuthGuard)
    async getSessions(@Req() req: any): Promise<ApiResponseDto<any>> {
        return this.securityService.getSessions(req.user.uuid);
    }

    /**
     * Download personal data (GDPR compliance)
     * GET /security/download-data
     */
    @Get('download-data')
    @UseGuards(JwtAuthGuard)
    async downloadData(@Req() req: any): Promise<ApiResponseDto<any>> {
        return this.securityService.downloadData(req.user.uuid);
    }

    /**
     * Delete user account
     * DELETE /security/delete-account
     */
    @Delete('delete-account')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async deleteAccount(@Req() req: any): Promise<ApiResponseDto<null>> {
        return this.securityService.deleteAccount(req.user.uuid);
    }
} 