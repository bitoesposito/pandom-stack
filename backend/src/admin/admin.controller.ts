import { Controller, Get, Put, Delete, Param, HttpCode, HttpStatus, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/auth.interface';
import { ApiResponseDto } from '../common/common.interface';
import { AdminService } from './admin.service';
import { Request } from 'express';

// Interface for authenticated admin request
interface AuthenticatedAdminRequest extends Request {
  user: {
    uuid: string;
    email: string;
    role: string;
  };
}

/**
 * Controller handling admin-related endpoints
 * Manages user administration, system metrics, and audit logs
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminController {
    constructor(
        private readonly adminService: AdminService
    ) { }

    /**
     * List and manage users
     * GET /admin/users
     */
    @Get('users')
    async getUsers(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('search') search: string | undefined,
        @Req() req: AuthenticatedAdminRequest
    ): Promise<ApiResponseDto<any>> {
        return this.adminService.getUsers(parseInt(page), parseInt(limit), search, req);
    }

    /**
     * Delete user account
     * DELETE /admin/users/:uuid
     */
    @Delete('users/:uuid')
    @HttpCode(HttpStatus.OK)
    async deleteUser(
        @Param('uuid') uuid: string,
        @Req() req: AuthenticatedAdminRequest
    ): Promise<ApiResponseDto<null>> {
        return this.adminService.deleteUser(uuid, req.user.uuid, req.user.email, req);
    }

    /**
     * System metrics and analytics
     * GET /admin/metrics
     */
    @Get('metrics')
    async getMetrics(@Req() req: AuthenticatedAdminRequest): Promise<ApiResponseDto<any>> {
        return this.adminService.getMetrics(req);
    }

    /**
     * Detailed system metrics
     * GET /admin/metrics/detailed
     */
    @Get('metrics/detailed')
    async getDetailedMetrics(@Req() req: AuthenticatedAdminRequest): Promise<ApiResponseDto<any>> {
        return this.adminService.getDetailedMetrics(req);
    }

    /**
     * View audit logs
     * GET /admin/audit-logs
     */
    @Get('audit-logs')
    async getAuditLogs(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '50',
        @Req() req: AuthenticatedAdminRequest
    ): Promise<ApiResponseDto<any>> {
        return this.adminService.getAuditLogs(parseInt(page), parseInt(limit), req);
    }
} 