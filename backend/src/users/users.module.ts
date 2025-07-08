import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { CommonModule } from '../common/modules/common.module';

/**
 * Users module configuration
 * Handles user profile management and operations
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile]),
    CommonModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {} 