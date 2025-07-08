import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from './logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

/**
 * Interface for user session data
 * 
 * Defines the structure of a user session including authentication
 * token, user information, and session metadata.
 */
export interface Session {
  /** Unique identifier of the user */
  userId: string;
  /** JWT token for authentication */
  token: string;
  /** When the session was created */
  createdAt: Date;
  /** When the session expires */
  expiresAt: Date;
  /** Optional device information for session tracking */
  deviceInfo?: string;
}

/**
 * Session Service
 * 
 * Manages user sessions and authentication tokens.
 * Provides session lifecycle management including creation, validation,
 * and invalidation of user sessions.
 * 
 * Features:
 * - Session creation with JWT tokens
 * - Session validation and expiration checking
 * - Session invalidation (single and bulk)
 * - Device information tracking
 * - Integration with user repository
 * - Comprehensive logging
 * 
 * Security Features:
 * - 24-hour session expiration
 * - Automatic cleanup of expired sessions
 * - User verification before session creation
 * - Secure token generation with user data
 * 
 * Session Management:
 * - In-memory session storage
 * - Automatic expiration handling
 * - Bulk session operations per user
 * - Device tracking for security
 * 
 * Usage:
 * - Injected into authentication services
 * - Manages user login/logout sessions
 * - Provides session validation for protected routes
 * - Supports multi-device session management
 * 
 * @example
 * // Create a new session
 * const session = await this.sessionService.createSession(userId, 'Chrome on Windows');
 * 
 * @example
 * // Validate a session
 * const isValid = await this.sessionService.validateSession(token);
 * 
 * @example
 * // Invalidate all user sessions
 * await this.sessionService.invalidateAllUserSessions(userId);
 */
@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, Session>();
  private readonly logger: LoggerService;

  constructor(
    private readonly jwtService: JwtService,
    logger: LoggerService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {
    this.logger = logger;
  }

  // ============================================================================
  // SESSION CREATION AND MANAGEMENT
  // ============================================================================

  /**
   * Create a new user session
   * 
   * Creates a new session for a user with a JWT token and expiration.
   * Verifies the user exists before creating the session.
   * 
   * @param userId - Unique identifier of the user
   * @param deviceInfo - Optional device information for tracking
   * @returns Promise with created session object
   * @throws Error if user is not found
   * 
   * @example
   * const session = await this.createSession('user123', 'Chrome on Windows');
   * // Returns: { userId: 'user123', token: 'jwt_token', createdAt: Date, expiresAt: Date }
   */
  async createSession(userId: string, deviceInfo?: string): Promise<Session> {
    // Verify user exists before creating session
    const user = await this.userRepository.findOne({ where: { uuid: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Generate JWT token with user information
    const token = this.jwtService.sign({ 
      sub: userId,
      email: user.email,
      role: user.role
    });
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const session: Session = {
      userId,
      token,
      createdAt: now,
      expiresAt,
      deviceInfo,
    };

    // Store session in memory
    this.sessions.set(token, session);
    this.logger.info('Session created', 'SessionService', { userId, deviceInfo });
    return session;
  }

  /**
   * Validate if a session is active and not expired
   * 
   * Checks if a session exists and is still valid.
   * Automatically removes expired sessions from storage.
   * 
   * @param token - JWT token to validate
   * @returns Promise with boolean indicating if session is valid
   * 
   * @example
   * const isValid = await this.validateSession('jwt_token_here');
   * // Returns: true if session is valid and not expired
   */
  async validateSession(token: string): Promise<boolean> {
    const session = this.sessions.get(token);
    if (!session) {
      return false;
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(token);
      this.logger.warn('Session expired', 'SessionService', { token });
      return false;
    }

    return true;
  }

  // ============================================================================
  // SESSION INVALIDATION
  // ============================================================================

  /**
   * Invalidate a specific session
   * 
   * Removes a session from storage, effectively logging out the user
   * from that specific session/token.
   * 
   * @param token - JWT token to invalidate
   * @returns Promise that resolves when session is invalidated
   * 
   * @example
   * await this.invalidateSession('jwt_token_here');
   * // Session is removed from storage
   */
  async invalidateSession(token: string): Promise<void> {
    if (this.sessions.delete(token)) {
      this.logger.info('Session invalidated', 'SessionService', { token });
    }
  }

  /**
   * Invalidate all sessions for a specific user
   * 
   * Removes all active sessions for a user, effectively logging them out
   * from all devices and sessions.
   * 
   * @param userId - Unique identifier of the user
   * @returns Promise that resolves when all sessions are invalidated
   * 
   * @example
   * await this.invalidateAllUserSessions('user123');
   * // All sessions for user123 are removed
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(token);
      }
    }
    this.logger.info('All user sessions invalidated', 'SessionService', { userId });
  }

  // ============================================================================
  // SESSION QUERYING
  // ============================================================================

  /**
   * Get all active sessions for a user
   * 
   * Returns all non-expired sessions for a specific user.
   * Useful for displaying active sessions or managing multi-device access.
   * 
   * @param userId - Unique identifier of the user
   * @returns Array of active session objects
   * 
   * @example
   * const activeSessions = this.getActiveSessions('user123');
   * // Returns: [{ userId: 'user123', token: 'token1', ... }, { userId: 'user123', token: 'token2', ... }]
   */
  getActiveSessions(userId: string): Session[] {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && new Date() <= session.expiresAt);
  }
} 