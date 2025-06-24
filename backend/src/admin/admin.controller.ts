import { Controller, Get, Put, Delete, Param, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiResponseDto } from '../common/common.interface';
import { AdminService } from './admin.service';

/**
 * Controller handling admin-related endpoints
 * Manages user administration, system metrics, and audit logs
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService
    ) { }

    /**
     * List and manage users
     * GET /admin/users
     */
    @Get('users')
    async getUsers(@Req() req: any): Promise<ApiResponseDto<any>> {
        return this.adminService.getUsers();
    }

    /**
     * Suspend user account
     * PUT /admin/users/:uuid/suspend
     */
    @Put('users/:uuid/suspend')
    @HttpCode(HttpStatus.OK)
    async suspendUser(@Param('uuid') uuid: string, @Req() req: any): Promise<ApiResponseDto<null>> {
        return this.adminService.suspendUser(uuid);
    }

    /**
     * Delete user account
     * DELETE /admin/users/:uuid
     */
    @Delete('users/:uuid')
    @HttpCode(HttpStatus.OK)
    async deleteUser(@Param('uuid') uuid: string, @Req() req: any): Promise<ApiResponseDto<null>> {
        return this.adminService.deleteUser(uuid);
    }

    /**
     * System metrics and analytics
     * GET /admin/metrics
     */
    @Get('metrics')
    async getMetrics(@Req() req: any): Promise<ApiResponseDto<any>> {
        return this.adminService.getMetrics();
    }

    /**
     * View audit logs
     * GET /admin/audit-logs
     */
    @Get('audit-logs')
    async getAuditLogs(@Req() req: any): Promise<ApiResponseDto<any>> {
        return this.adminService.getAuditLogs();
    }
} 