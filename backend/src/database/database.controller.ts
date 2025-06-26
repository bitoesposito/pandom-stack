import { Controller, Get, Post } from '@nestjs/common';
import { ApiResponseDto } from '../common/common.interface';
import { DatabaseService } from './database.service';

/**
 * Controller for database management and status
 */
@Controller('database')
export class DatabaseController {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Check database status
   * GET /database/status
   */
  @Get('status')
  async getStatus(): Promise<ApiResponseDto<any>> {
    try {
      const tablesExist = await this.databaseService.checkTables();
      const tableInfo = await this.databaseService.getTableInfo();
      
      return ApiResponseDto.success({
        status: 'connected',
        tables_exist: tablesExist,
        table_info: tableInfo,
      }, 'Database status retrieved successfully');
    } catch (error) {
      return ApiResponseDto.error('Database status check failed', 500);
    }
  }

  /**
   * Force database synchronization
   * POST /database/sync
   */
  @Post('sync')
  async syncDatabase(): Promise<ApiResponseDto<any>> {
    try {
      const success = await this.databaseService.forceSync();
      
      if (success) {
        return ApiResponseDto.success(null, 'Database synchronized successfully');
      } else {
        return ApiResponseDto.error('Database synchronization failed', 500);
      }
    } catch (error) {
      return ApiResponseDto.error('Database synchronization failed', 500);
    }
  }
} 