import { Body, Controller, Post, Get, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto, ResendVerificationDto, RefreshTokenDto } from './auth.dto';
import { ApiResponseDto } from '../common/common.interface';
import { AuthService } from './auth.service';

/**
 * Controller handling authentication-related endpoints
 * Manages user registration, login, verification, and password recovery
 */
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    /**
     * Register a new user
     * POST /auth/register
     */
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto): Promise<ApiResponseDto<any>> {
        return this.authService.register(registerDto);
    }

    /**
     * Login and return JWT
     * POST /auth/login
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<ApiResponseDto<any>> {
        return this.authService.login(loginDto);
    }

    /**
     * Refresh JWT token
     * POST /auth/refresh
     */
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<ApiResponseDto<any>> {
        return this.authService.refreshToken(refreshTokenDto.refresh_token);
    }

    /**
     * Returns logged user data
     * GET /auth/me
     */
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMe(@Req() req: any): Promise<ApiResponseDto<any>> {
        return this.authService.getMe(req.user.uuid);
    }

    /**
     * Verify email via token
     * POST /auth/verify
     */
    @Post('verify')
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<ApiResponseDto<null>> {
        return this.authService.verifyEmail(verifyEmailDto);
    }

    /**
     * Send password reset link
     * POST /auth/forgot-password
     */
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ApiResponseDto<any>> {
        return this.authService.forgotPassword(forgotPasswordDto);
    }

    /**
     * Reset password via token
     * POST /auth/reset-password
     */
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<ApiResponseDto<null>> {
        return this.authService.resetPassword(resetPasswordDto);
    }

    /**
     * Resend verification email
     * POST /auth/resend-verification
     */
    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    async resendVerification(@Body() resendVerificationDto: ResendVerificationDto): Promise<ApiResponseDto<null>> {
        return this.authService.resendVerificationEmail(resendVerificationDto.email);
    }
}