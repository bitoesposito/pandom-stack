import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from './logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export interface Session {
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  deviceInfo?: string;
}

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

  async createSession(userId: string, deviceInfo?: string): Promise<Session> {
    const user = await this.userRepository.findOne({ where: { uuid: userId } });
    if (!user) {
      throw new Error('User not found');
    }

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

    this.sessions.set(token, session);
    this.logger.info('Session created', 'SessionService', { userId, deviceInfo });
    return session;
  }

  async validateSession(token: string): Promise<boolean> {
    const session = this.sessions.get(token);
    if (!session) {
      return false;
    }

    if (new Date() > session.expiresAt) {
      this.sessions.delete(token);
      this.logger.warn('Session expired', 'SessionService', { token });
      return false;
    }

    return true;
  }

  async invalidateSession(token: string): Promise<void> {
    if (this.sessions.delete(token)) {
      this.logger.info('Session invalidated', 'SessionService', { token });
    }
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(token);
      }
    }
    this.logger.info('All user sessions invalidated', 'SessionService', { userId });
  }

  getActiveSessions(userId: string): Session[] {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && new Date() <= session.expiresAt);
  }
} 