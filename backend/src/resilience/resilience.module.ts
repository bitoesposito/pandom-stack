import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResilienceController } from './resilience.controller';
import { ResilienceService } from './resilience.service';
import { User } from '../auth/entities/user.entity';

/**
 * Resilience module configuration
 * Handles system status and offline data operations
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [ResilienceController],
  providers: [ResilienceService],
  exports: [ResilienceService],
})
export class ResilienceModule {} 