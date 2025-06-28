import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { UserRole } from '../auth/auth.interface';
import * as bcrypt from 'bcryptjs';

// Simplified module for seeding
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST') || configService.get('DB_HOST') || 'postgres',
        port: parseInt(configService.get('POSTGRES_PORT') || '5432'),
        username: configService.get('POSTGRES_USER') || 'user',
        password: configService.get('POSTGRES_PASSWORD') || 'password',
        database: configService.get('POSTGRES_DB') || 'postgres',
        entities: [User, UserProfile],
        synchronize: true, // Enable sync to create tables
        logging: true,
        ssl: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, UserProfile]),
  ],
  providers: [],
})
class SeedModule {}

async function createUserRoleEnum(dataSource: any) {
  const logger = new Logger('EnumCreation');
  try {
    // Verifica se l'enum esiste già
    const enumExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'userrole'
      )
    `);
    
    if (!enumExists[0].exists) {
      logger.log('Creating UserRole enum...');
      await dataSource.query(`
        CREATE TYPE "userrole" AS ENUM ('admin', 'user')
      `);
      logger.log('UserRole enum created successfully');
    } else {
      logger.log('UserRole enum already exists');
    }
  } catch (error) {
    logger.error('Failed to create UserRole enum:', error);
  }
}

async function waitForTables(app: any, maxRetries = 30, delay = 2000) {
  const logger = new Logger('TableWait');
  const dataSource = app.get(DataSource);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Create enum first
      await createUserRoleEnum(dataSource);
      
      // Try to query the table to see if it exists
      await dataSource.query('SELECT 1 FROM auth_users LIMIT 1');
      logger.log('Tables are ready');
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error('Tables not ready after maximum retries');
      }
      logger.log(`Waiting for tables... (attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function seedAdmin() {
  const logger = new Logger('AdminSeed');
  
  try {
    logger.log('Starting admin user seeding...');
    
    // Create a minimal app instance for seeding
    const app = await NestFactory.createApplicationContext(SeedModule);
    
    // Wait for tables to be created
    await waitForTables(app);
    
    // Get the repositories using DataSource
    const dataSource = app.get(DataSource);
    const userRepository = dataSource.getRepository(User);
    const userProfileRepository = dataSource.getRepository(UserProfile);
    const configService = app.get(ConfigService);
    
    // Get admin credentials from environment
    const adminEmail = configService.get<string>('ADMIN_EMAIL');
    const adminPassword = configService.get<string>('ADMIN_PASSWORD');
    const adminRole = configService.get<string>('ADMIN_ROLE', 'admin');

    if (!adminEmail || !adminPassword) {
      logger.warn('Admin credentials not configured, skipping admin user creation');
      await app.close();
      process.exit(0);
    }

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({ where: { email: adminEmail } });
    
    if (existingAdmin) {
      logger.log('Admin user already exists', { email: adminEmail });
      await app.close();
      process.exit(0);
    }

    logger.log('Creating admin user...');
    
    // Create admin profile first
    const adminProfile = new UserProfile();
    adminProfile.tags = ['admin'];
    adminProfile.metadata = { role: adminRole };
    
    const savedProfile = await userProfileRepository.save(adminProfile);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Create admin user
    const adminUser = new User();
    adminUser.email = adminEmail;
    adminUser.password_hash = hashedPassword;
    adminUser.role = UserRole.admin; // Use enum instead of string
    adminUser.is_active = true;
    adminUser.is_verified = true;
    adminUser.is_configured = true;
    adminUser.profile_uuid = savedProfile.uuid;
    
    await userRepository.save(adminUser);
    
    logger.log('Admin user and profile created successfully', { 
      email: adminEmail, 
      role: adminRole,
      profile_uuid: savedProfile.uuid 
    });
    
    // Close the app
    await app.close();
    
    process.exit(0);
  } catch (error) {
    logger.error('Admin seeding failed:', error);
    process.exit(1);
  }
}

seedAdmin(); 