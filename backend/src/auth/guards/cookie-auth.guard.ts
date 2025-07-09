import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * Cookie Authentication Guard
 * 
 * Validates JWT tokens from httpOnly cookies instead of Authorization header.
 * Provides secure authentication for cookie-based token management.
 * 
 * Features:
 * - Extracts JWT token from httpOnly cookies
 * - Validates token signature and expiration
 * - Adds user data to request object
 * - Handles missing or invalid tokens gracefully
 * 
 * Security:
 * - Uses httpOnly cookies for XSS protection
 * - Validates token signature
 * - Checks token expiration
 * - Provides detailed error logging
 */
@Injectable()
export class CookieAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  /**
   * Validate authentication from cookies
   * 
   * Extracts and validates JWT token from httpOnly cookies.
   * Adds user information to request object if authentication succeeds.
   * 
   * @param context - Execution context with request information
   * @returns Promise<boolean> - True if authentication succeeds
   * 
   * @throws UnauthorizedException - If token is missing or invalid
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromCookies(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token found in cookies');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  /**
   * Extract JWT token from cookies
   * 
   * Looks for the access token in the request cookies.
   * 
   * @param request - Express request object
   * @returns string | undefined - JWT token or undefined if not found
   */
  private extractTokenFromCookies(request: Request): string | undefined {
    const cookies = request.cookies;
    return cookies?.access_token;
  }
} 