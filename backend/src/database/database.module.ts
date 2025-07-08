import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';

/**
 * Database Module
 * 
 * Provides database management functionality including initialization,
 * synchronization, and status monitoring for the application.
 * 
 * Features:
 * - Database connection management
 * - Entity registration and TypeORM configuration
 * - Database status monitoring
 * - Schema synchronization utilities
 * - Custom enum creation (UserRole)
 * 
 * Entities:
 * - User: Authentication and user management
 * - UserProfile: Extended user profile information
 * 
 * Services:
 * - DatabaseService: Core database operations
 * - DatabaseController: REST API endpoints for database management
 * 
 * Exports:
 * - TypeOrmModule: For use in other modules
 * - DatabaseService: For database operations in other services
 * 
 * Usage:
 * - Imported in AppModule for database functionality
 * - Provides database management endpoints
 * - Handles database initialization and setup
 * 
 * @example
 * // In AppModule
 * imports: [
 *   DatabaseModule,
 *   // other modules...
 * ]
 * 
 * @example
 * // In another service
 * constructor(
 *   private databaseService: DatabaseService
 * ) {}
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