import { Controller, Get, Delete, Param, HttpCode, HttpStatus, UseGuards, Req, Res, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponseDto } from '../common/common.interface';
import { SecurityService } from './security.service';
import { Request, Response } from 'express';

// Interface for authenticated request
interface AuthenticatedRequest extends Request {
  user: {
    uuid: string;
    email: string;
    role: string;
  };
}

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
    async getSecurityLogs(
        @Req() req: AuthenticatedRequest,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ): Promise<ApiResponseDto<any>> {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        return this.securityService.getSecurityLogs(req.user.uuid, pageNum, limitNum, req);
    }

    /**
     * View active sessions/tokens
     * GET /security/sessions
     */
    @Get('sessions')
    @UseGuards(JwtAuthGuard)
    async getSessions(@Req() req: AuthenticatedRequest): Promise<ApiResponseDto<any>> {
        return this.securityService.getSessions(req.user.uuid, req);
    }

    /**
     * Download personal data (GDPR compliance)
     * GET /security/download-data
     */
    @Get('download-data')
    @UseGuards(JwtAuthGuard)
    async downloadData(@Req() req: AuthenticatedRequest): Promise<ApiResponseDto<any>> {
        return this.securityService.downloadData(req.user.uuid, req);
    }

    /**
     * Download user data file
     * GET /downloads/user-data-:userId-:timestamp.json
     */
    @Get('downloads/user-data-:userId-:timestamp.json')
    async downloadUserDataFile(
        @Param('userId') userId: string,
        @Param('timestamp') timestamp: string,
        @Res() res: Response
    ) {
        return this.securityService.downloadUserDataFile(userId, timestamp, res);
    }

    /**
     * Delete user account
     * DELETE /security/delete-account
     */
    @Delete('delete-account')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async deleteAccount(@Req() req: AuthenticatedRequest): Promise<ApiResponseDto<null>> {
        return this.securityService.deleteAccount(req.user.uuid);
    }
} 