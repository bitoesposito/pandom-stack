import { Body, Controller, Post, HttpCode, HttpStatus, ValidationPipe, UsePipes, BadRequestException, UnauthorizedException, InternalServerErrorException, Get, Req, UseGuards } from '@nestjs/common';
import { LoginResponse } from './auth.interface';
import { LoginDto, ForgotPasswordDto, ResetPasswordDto } from './auth.dto';
import { ApiResponseDto } from 'src/common/common.interface';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';

/**
 * Controller handling authentication-related endpoints
 * Manages user login, password recovery, and authentication processes
 */
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    /**
     * Handles user login requests
     * Validates input data and returns JWT token on success
     * 
     * @param loginDto - Login credentials (email and password)
     * @returns Promise<ApiResponseDto<LoginResponse>> - Login response with JWT token and user data
     * @throws BadRequestException - If input validation fails
     * @throws UnauthorizedException - If credentials are invalid
     * @throws InternalServerErrorException - If server error occurs
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
            const messages = errors.map(error => {
                if (error.constraints) {
                    return Object.values(error.constraints).join(', ');
                }
                return 'Invalid input';
            });
            throw new BadRequestException(messages.join(', '));
        }
    }))
    async login(@Body() loginDto: LoginDto): Promise<ApiResponseDto<LoginResponse>> {
        try {
            return await this.authService.login(loginDto.email, loginDto.password);
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                return ApiResponseDto.error<LoginResponse>(error.message, HttpStatus.UNAUTHORIZED);
            }
            if (error instanceof InternalServerErrorException) {
                return ApiResponseDto.error<LoginResponse>(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return ApiResponseDto.error<LoginResponse>('An unexpected error occurred', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Handles password recovery requests
     * Sends a password reset link if the email is registered
     * 
     * @param forgotPasswordDto - Email address for password recovery
     * @returns Promise<ApiResponseDto<any>> - Success response with token expiry
     * @throws BadRequestException - If input validation fails
     * @throws HttpException - If rate limit exceeded or other errors occur
     */
    @Post('recover')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
    }))
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ApiResponseDto<any>> {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }

    /**
     * Handles password reset requests
     * Verifies the reset token and updates the user's password
     * 
     * @param resetPasswordDto - Reset password data (token and new password)
     * @returns Promise<ApiResponseDto<null>> - Success response
     * @throws BadRequestException - If input validation fails
     * @throws HttpException - If token is invalid or expired
     */
    @Post('verify')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
    }))
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<ApiResponseDto<null>> {
        return this.authService.resetPassword(resetPasswordDto);
    }
}