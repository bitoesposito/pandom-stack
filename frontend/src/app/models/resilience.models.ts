/**
 * Models for Resilience API responses
 * Handles system status, backup operations, and disaster recovery
 */

export interface SystemStatusResponse {
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

export interface BackupResponse {
  backup_id: string;
  backup_file: string;
  backup_size: number;
  created_at: string;
  status: 'completed' | 'restored' | 'available';
}

export interface BackupStatusResponse {
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