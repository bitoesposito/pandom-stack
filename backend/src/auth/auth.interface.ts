import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';
import { SetMetadata } from '@nestjs/common';

/**
 * Enum defining the available user roles in the system
 */
export enum UserRole {
    admin = 'admin',
    user = 'user',
}

/**
 * Key used for storing roles in metadata
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator for specifying required roles for a route or controller
 * @param roles - Array of UserRole values
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Interface for JWT payload structure
 */
export interface JwtPayload {
    sub: string;      // User UUID
    email: string;    // User email
    role: UserRole;   // User role
    iat?: number;     // Token issued at timestamp
}

/**
 * Interface for login response structure
 */
export interface LoginResponse {
    access_token: string;  // JWT token
    user: {
        uuid: string;      // User UUID
        email: string;     // User email
        role: UserRole;    // User role
    };
}

export interface LoginAttempt {
    count: number;
    timestamp: number;
    lockedUntil?: number;
}

export interface SecurityConfig {
    maxLoginAttempts: number;
    lockoutDuration: number; // in milliseconds
    rateLimitWindow: number; // in milliseconds
    maxRequestsPerWindow: number;
}