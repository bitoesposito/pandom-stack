import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';

/**
 * Database module configuration
 * Handles database initialization and entity loading
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
    ]),
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [TypeOrmModule, DatabaseService],
})
export class DatabaseModule {} 