import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { CommonModule } from '../common/modules/common.module';

/**
 * Security module configuration
 * Handles security logs, sessions, and data privacy operations
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile]),
    CommonModule, // For AuditService
  ],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {} 