import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty, IsOptional, Length, IsBoolean } from 'class-validator';
import { VALIDATION_PATTERNS } from '../common/common.interface';

/**
 * Data Transfer Object for user login
 * Contains validation rules for email and password
 */
export class LoginDto {
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
    @Matches(VALIDATION_PATTERNS.PASSWORD, {
        message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
    password: string;

    @IsBoolean()
    @IsOptional()
    rememberMe?: boolean;
}

/**
 * Data Transfer Object for user registration
 * Contains validation rules for email, password and optional display name
 */
export class RegisterDto {
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
    @Matches(VALIDATION_PATTERNS.PASSWORD, {
        message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
    password: string;

    @IsString()
    @IsOptional()
    @Length(1, 100, { message: 'Display name must be between 1 and 100 characters' })
    display_name?: string;
}

/**
 * Data Transfer Object for refresh token requests
 * Contains validation rules for refresh token
 */
export class RefreshTokenDto {
    @IsString()
    @IsNotEmpty({ message: 'Refresh token is required' })
    refresh_token: string;
}

/**
 * Data Transfer Object for forgot password requests
 * Contains validation rules for email
 */
export class ForgotPasswordDto {
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;
}

/**
 * Data Transfer Object for password reset
 * Contains validation rules for token and new password
 */
export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'Token is required' })
    token: string;

    @IsString()
    @IsNotEmpty({ message: 'New password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
    @Matches(VALIDATION_PATTERNS.PASSWORD, {
        message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
    password: string;
}

/**
 * Data Transfer Object for email verification
 * Contains validation rules for verification token
 */
export class VerifyEmailDto {
    @IsString()
    @IsNotEmpty({ message: 'Verification token is required' })
    token: string;
}

/**
 * Data Transfer Object for resending verification email
 * Contains validation rules for email
 */
export class ResendVerificationDto {
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;
}