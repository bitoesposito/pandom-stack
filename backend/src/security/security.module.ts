import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { User } from '../auth/entities/user.entity';

/**
 * Security module configuration
 * Handles security logs, sessions, and data privacy operations
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {} 