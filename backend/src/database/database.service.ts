import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Logger } from '@nestjs/common';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async initializeDatabase() {
    this.logger.log('Starting database initialization...');
    
    try {
      // Create tables if they don't exist
      this.logger.log('Creating tables...');
      await this.createTables();
      this.logger.log('Tables created successfully');
      
      // Check if admin exists, if not create it
      this.logger.log('Checking for admin user...');
      await this.createAdminIfNotExists();
      this.logger.log('Admin user check completed');
      
      this.logger.log('Database initialization completed successfully');
    } catch (error) {
      this.logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables() {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      this.logger.log('Connecting to database...');
      await queryRunner.connect();
      this.logger.log('Starting transaction...');
      await queryRunner.startTransaction();

      // Create user_profiles table first
      this.logger.log('Creating user_profiles table...');
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          display_name VARCHAR(100),
          slug VARCHAR(100) UNIQUE,
          avatar_url TEXT,
          description TEXT,
          tags TEXT[],
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      this.logger.log('user_profiles table created successfully');

      // Create auth_users table after user_profiles
      this.logger.log('Creating auth_users table...');
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS auth_users (
          uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'user',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          is_verified BOOLEAN NOT NULL DEFAULT FALSE,
          is_configured BOOLEAN NOT NULL DEFAULT FALSE,
          verification_token TEXT,
          verification_expires TIMESTAMP,
          reset_token TEXT,
          reset_token_expiry TIMESTAMP,
          last_login_at TIMESTAMP,
          profile_uuid UUID UNIQUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_profile FOREIGN KEY (profile_uuid) REFERENCES user_profiles(uuid) ON DELETE SET NULL
        )
      `);
      this.logger.log('auth_users table created successfully');

      // Create updated_at trigger function
      this.logger.log('Creating trigger function...');
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

      // Create triggers for both tables
      this.logger.log('Creating triggers...');
      await queryRunner.query(`
        DROP TRIGGER IF EXISTS update_auth_users_updated_at ON auth_users;
        CREATE TRIGGER update_auth_users_updated_at
          BEFORE UPDATE ON auth_users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);

      await queryRunner.query(`
        DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
        CREATE TRIGGER update_user_profiles_updated_at
          BEFORE UPDATE ON user_profiles
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);

      this.logger.log('Committing transaction...');
      await queryRunner.commitTransaction();
      this.logger.log('Tables and triggers created successfully');
    } catch (err) {
      this.logger.error('Error creating tables:', err);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async createAdminIfNotExists() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    const adminRole = this.configService.get<string>('ADMIN_ROLE');

    if (!adminEmail || !adminPassword || !adminRole) {
      throw new Error('Missing required environment variables for admin user creation');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Check if admin exists
      const existingAdmin = await queryRunner.query(
        'SELECT 1 FROM auth_users WHERE email = $1',
        [adminEmail]
      );

      if (!existingAdmin.length) {
        // Create admin profile first
        const adminProfile = await queryRunner.query(
          `INSERT INTO user_profiles (display_name, slug)
           VALUES ($1, $2)
           RETURNING uuid`,
          [adminEmail, 'admin']
        );

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        // Create admin user with profile reference
        await queryRunner.query(
          `INSERT INTO auth_users (email, password_hash, role, is_configured, profile_uuid)
           VALUES ($1, $2, $3, false, $4)`,
          [adminEmail, hashedPassword, adminRole, adminProfile[0].uuid]
        );

        this.logger.log('Admin user and profile created successfully', { email: adminEmail });
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create admin user:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
} 