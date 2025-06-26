import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { CommonModule } from '../common/modules/common.module';

/**
 * Admin module configuration
 * Handles user administration, system metrics, and audit logs
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile]),
    CommonModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {} 