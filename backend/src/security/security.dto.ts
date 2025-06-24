// Response DTOs for SECURITY module
// These are interfaces since they represent response data structures

/**
 * Response interface for security logs
 */
export interface SecurityLogsResponseDto {
  logs: Array<{
    id: string;
    action: string;
    ip_address: string;
    user_agent: string;
    timestamp: string;
    success: boolean;
    details?: Record<string, any>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Response interface for user sessions
 */
export interface SessionsResponseDto {
  sessions: Array<{
    id: string;
    device_info: string;
    ip_address: string;
    created_at: string;
    last_used: string;
    is_current: boolean;
  }>;
}

/**
 * Response interface for data download
 */
export interface DownloadDataResponseDto {
  download_url: string;
  expires_at: string;
  file_size: number;
  format: 'json' | 'csv' | 'xml';
} 