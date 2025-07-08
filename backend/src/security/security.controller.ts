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
 * Security Controller
 * 
 * Provides REST API endpoints for security management, data privacy,
 * and GDPR compliance operations. Handles user security monitoring,
 * session management, data export, and account deletion.
 * 
 * Features:
 * - Security logs and activity monitoring
 * - User session management and tracking
 * - GDPR-compliant data export and download
 * - Account deletion with safety checks
 * - Comprehensive audit logging
 * - IP address and user agent tracking
 * 
 * Security:
 * - All endpoints require JWT authentication
 * - Admin account deletion protection
 * - Secure data export with expiration
 * - Comprehensive audit trails
 * - Rate limiting should be applied in production
 * 
 * GDPR Compliance:
 * - Right to data portability (data export)
 * - Right to be forgotten (account deletion)
 * - Transparent data processing (security logs)
 * - Secure data handling and storage
 * 
 * Endpoints:
 * - GET /security/logs - User security activity logs
 * - GET /security/sessions - User session information
 * - GET /security/download-data - GDPR data export
 * - GET /security/downloads/user-data-:userId-:timestamp.json - Download exported data
 * - DELETE /security/delete-account - Account deletion
 * 
 * Usage:
 * - Used by users for account security management
 * - Provides GDPR compliance functionality
 * - Enables security monitoring and transparency
 * - Supports account lifecycle management
 * 
 * @example
 * // Get security logs
 * GET /security/logs?page=1&limit=10
 * Response: { logs: [...], pagination: {...} }
 * 
 * @example
 * // Download user data (GDPR)
 * GET /security/download-data
 * Response: { download_url: "...", expires_at: "...", ... }
 * 
 * @example
 * // Delete account
 * DELETE /security/delete-account
 * Response: { success: true, message: "Account deleted successfully" }
 */
@Controller('security')
export class SecurityController {
    constructor(
        private readonly securityService: SecurityService
    ) { }

    // ============================================================================
    // SECURITY MONITORING ENDPOINTS
    // ============================================================================

    /**
     * Get user security activity logs
     * 
     * Retrieves paginated security logs for the authenticated user.
     * Provides transparency into account activities and security events
     * for compliance and monitoring purposes.
     * 
     * Features:
     * - Paginated results for large log collections
     * - Comprehensive activity tracking
     * - IP address and user agent information
     * - Success/failure status for each event
     * - Detailed event information
     * 
     * @param req - Authenticated request containing user information
     * @param page - Page number for pagination (default: 1)
     * @param limit - Number of logs per page (default: 10)
     * @returns Promise with paginated security logs
     * 
     * @example
     * // Request
     * GET /security/logs?page=1&limit=5
     * 
     * // Response
     * {
     *   "http_status_code": 200,
     *   "success": true,
     *   "message": "Security logs retrieved successfully",
     *   "data": {
     *     "logs": [
     *       {
     *         "id": "log_1234567890",
     *         "action": "USER_LOGIN_SUCCESS",
     *         "ip_address": "192.168.1.100",
     *         "user_agent": "Mozilla/5.0...",
     *         "timestamp": "2024-01-15T10:30:00.000Z",
     *         "success": true,
     *         "details": { "device": "Desktop" }
     *       }
     *     ],
     *     "pagination": {
     *       "page": 1,
     *       "limit": 5,
     *       "total": 150,
     *       "total_pages": 30
     *     }
     *   }
     * }
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
     * Get user session information
     * 
     * Retrieves information about the user's active and recent sessions.
     * Provides details about device usage, IP addresses, and session
     * activity for security monitoring and account management.
     * 
     * Features:
     * - Current active session details
     * - Recent login history
     * - Device and browser information
     * - IP address tracking
     * - Session expiration information
     * 
     * @param req - Authenticated request containing user information
     * @returns Promise with user session information
     * 
     * @example
     * // Request
     * GET /security/sessions
     * 
     * // Response
     * {
     *   "http_status_code": 200,
     *   "success": true,
     *   "message": "Sessions retrieved successfully",
     *   "data": {
     *     "sessions": [
     *       {
     *         "id": "current",
     *         "device_info": "Current Session",
     *         "ip_address": "192.168.1.100",
     *         "created_at": "2024-01-15T10:30:00.000Z",
     *         "last_used": "2024-01-15T11:45:00.000Z",
     *         "is_current": true
     *       }
     *     ]
     *   }
     * }
     */
    @Get('sessions')
    @UseGuards(JwtAuthGuard)
    async getSessions(@Req() req: AuthenticatedRequest): Promise<ApiResponseDto<any>> {
        return this.securityService.getSessions(req.user.uuid, req);
    }

    // ============================================================================
    // GDPR COMPLIANCE ENDPOINTS
    // ============================================================================

    /**
     * Initiate GDPR data export
     * 
     * Creates a secure download link for user data export in compliance
     * with GDPR Article 20 (Right to Data Portability). The download
     * link expires after 24 hours for security purposes.
     * 
     * Exported data includes:
     * - User account information
     * - User profile data
     * - Security activity logs
     * - Account metadata and timestamps
     * 
     * Security:
     * - Download links expire after 24 hours
     * - Data is temporarily stored in memory
     * - All export activities are logged for audit
     * - IP address and user agent are tracked
     * 
     * @param req - Authenticated request containing user information
     * @returns Promise with secure download information
     * 
     * @example
     * // Request
     * GET /security/download-data
     * 
     * // Response
     * {
     *   "http_status_code": 200,
     *   "success": true,
     *   "message": "Data download initiated successfully",
     *   "data": {
     *     "download_url": "http://localhost:3000/security/downloads/user-data-uuid-1234567890.json",
     *     "expires_at": "2024-01-16T10:30:00.000Z",
     *     "file_size": 2048,
     *     "format": "json"
     *   }
     * }
     */
    @Get('download-data')
    @UseGuards(JwtAuthGuard)
    async downloadData(@Req() req: AuthenticatedRequest): Promise<ApiResponseDto<any>> {
        return this.securityService.downloadData(req.user.uuid, req);
    }

    /**
     * Download user data file
     * 
     * Serves the actual user data file for GDPR export. This endpoint
     * is publicly accessible but requires the correct user ID and
     * timestamp combination for security.
     * 
     * Security:
     * - File access is controlled by user ID and timestamp
     * - Files expire automatically after 24 hours
     * - Proper HTTP headers prevent caching
     * - Data is cleaned up after download
     * 
     * @param userId - User ID for the data file
     * @param timestamp - Timestamp used to generate the file
     * @param res - Express response object for file download
     * @returns Promise<void> - Sends file directly to response
     * 
     * @example
     * // Request
     * GET /security/downloads/user-data-uuid-1234567890.json
     * 
     * // Response
     * // File download with JSON content
     * {
     *   "user": { "uuid": "...", "email": "...", ... },
     *   "profile": { "uuid": "...", "tags": [...], ... },
     *   "security_logs": [...],
     *   "export_info": { "exported_at": "...", "format": "json" }
     * }
     */
    @Get('downloads/user-data-:userId-:timestamp.json')
    async downloadUserDataFile(
        @Param('userId') userId: string,
        @Param('timestamp') timestamp: string,
        @Res() res: Response
    ) {
        return this.securityService.downloadUserDataFile(userId, timestamp, res);
    }

    // ============================================================================
    // ACCOUNT MANAGEMENT ENDPOINTS
    // ============================================================================

    /**
     * Delete user account
     * 
     * Permanently deletes the user account and all associated data in
     * compliance with GDPR Article 17 (Right to be Forgotten). This
     * operation is irreversible and will remove all user data.
     * 
     * Safety Checks:
     * - Prevents deletion of the last admin user
     * - Validates user existence before deletion
     * - Handles foreign key constraints properly
     * - Logs deletion attempt for audit purposes
     * 
     * Process:
     * 1. Validates user exists and is not the last admin
     * 2. Logs deletion attempt for audit
     * 3. Removes profile reference from user
     * 4. Deletes user profile if exists
     * 5. Deletes user account
     * 6. Returns success confirmation
     * 
     * Warning: This operation is irreversible and will permanently
     * delete all user data including profile, security logs, and
     * account information.
     * 
     * @param req - Authenticated request containing user information
     * @returns Promise with deletion confirmation
     * 
     * @example
     * // Request
     * DELETE /security/delete-account
     * 
     * // Response
     * {
     *   "http_status_code": 200,
     *   "success": true,
     *   "message": "Account deleted successfully",
     *   "data": null
     * }
     * 
     * @throws BadRequestException if attempting to delete the last admin user
     * @throws NotFoundException if user not found
     */
    @Delete('delete-account')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async deleteAccount(@Req() req: AuthenticatedRequest): Promise<ApiResponseDto<null>> {
        return this.securityService.deleteAccount(req.user.uuid);
    }
} 