import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../auth.interface';

/**
 * JWT Strategy for Passport authentication
 * Handles JWT token validation and user authentication
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    
    super({
      // Extract JWT from Authorization header as Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // Don't ignore expired tokens
      ignoreExpiration: false,
      
      // Get JWT secret from environment variables
      secretOrKey: secret,
    });
  }

  /**
   * Validates the JWT payload and returns user information
   * 
   * @param payload - The decoded JWT payload
   * @returns Object containing user information (uuid, email, role)
   */
  async validate(payload: JwtPayload) {
    return {
      uuid: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}