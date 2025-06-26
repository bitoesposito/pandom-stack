import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('Initializing database...');
      
      // Verifica connessione
      await this.dataSource.query('SELECT 1');
      this.logger.log('Database connection established');
      
      // Crea l'enum UserRole se non esiste
      await this.createUserRoleEnum();
      
      // Verifica che le tabelle esistano
      const tables = await this.dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('auth_users', 'user_profiles')
      `);
      
      this.logger.log(`Found ${tables.length} tables: ${tables.map(t => t.table_name).join(', ')}`);
      
      if (tables.length === 0) {
        this.logger.warn('No tables found. TypeORM should create them automatically with synchronize: true');
      }
      
    } catch (error) {
      this.logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  async createUserRoleEnum() {
    try {
      // Verifica se l'enum esiste già
      const enumExists = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_type 
          WHERE typname = 'userrole'
        )
      `);
      
      if (!enumExists[0].exists) {
        this.logger.log('Creating UserRole enum...');
        await this.dataSource.query(`
          CREATE TYPE "userrole" AS ENUM ('admin', 'user')
        `);
        this.logger.log('UserRole enum created successfully');
      } else {
        this.logger.log('UserRole enum already exists');
      }
    } catch (error) {
      this.logger.error('Failed to create UserRole enum:', error);
    }
  }

  async checkTables() {
    try {
      const result = await this.dataSource.query('SELECT 1 FROM auth_users LIMIT 1');
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  async getTableInfo() {
    try {
      const tables = await this.dataSource.query(`
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name IN ('auth_users', 'user_profiles')
        ORDER BY table_name, ordinal_position
      `);
      
      return tables;
    } catch (error) {
      this.logger.error('Failed to get table info:', error);
      return [];
    }
  }

  async forceSync() {
    try {
      this.logger.log('Forcing database synchronization...');
      
      // Crea l'enum UserRole prima della sincronizzazione
      await this.createUserRoleEnum();
      
      // Forza la sincronizzazione delle entità
      await this.dataSource.synchronize(true);
      
      this.logger.log('Database synchronization completed');
      return true;
    } catch (error) {
      this.logger.error('Database synchronization failed:', error);
      return false;
    }
  }
} 