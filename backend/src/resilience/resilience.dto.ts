// Response DTOs for RESILIENCE module
// These are interfaces since they represent response data structures

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
  metrics: {
    active_users: number;
    total_requests: number;
    error_rate: number;
  };
}

/**
 * Response interface for offline data export
 */
export interface OfflineDataResponseDto {
  download_url: string;
  expires_at: string;
  data_summary: {
    profile_data: boolean;
    security_logs: boolean;
    user_preferences: boolean;
  };
  file_size: number;
  format: 'json' | 'zip';
} 