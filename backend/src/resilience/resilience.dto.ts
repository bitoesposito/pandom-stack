// Response DTOs for RESILIENCE module
// These are interfaces since they represent response data structures

import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

/**
 * Response interface for system status
 */
export interface SystemStatusResponseDto {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'healthy' | 'degraded' | 'down';
    storage: 'healthy' | 'degraded' | 'down';
    email: 'healthy' | 'degraded' | 'down';
  };
}

/**
 * Response interface for backup operations
 */
export interface BackupResponseDto {
  backup_id: string;
  backup_file: string;
  backup_size: number;
  created_at: string;
  status: 'completed' | 'restored' | 'available';
}

export class BackupStatusResponseDto {
  last_backup: {
    timestamp: string;
    file: string;
    size: number;
    checksum_valid: boolean;
  } | null;
  total_backups: number;
  total_size: number;
  retention_policy: {
    days: number;
    next_cleanup: string;
  };
  automation_status: {
    backup_cron: 'running' | 'stopped';
    cleanup_cron: 'running' | 'stopped';
    verify_cron: 'running' | 'stopped';
  };
} 