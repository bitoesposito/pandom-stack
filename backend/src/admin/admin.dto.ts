// Response DTOs for ADMIN module
// These are interfaces since they represent response data structures

/**
 * Response interface for user management
 */
export interface UserManagementResponseDto {
  users: Array<{
    uuid: string;
    email: string;
    role: 'user' | 'admin';
    status: 'active' | 'suspended' | 'deleted';
    created_at: string;
    last_login?: string;
    profile?: {
      first_name?: string;
      last_name?: string;
      phone?: string;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Response interface for system metrics
 */
export interface SystemMetricsResponseDto {
  overview: {
    total_users: number;
    active_users: number;
    new_users_today: number;
    total_requests: number;
    error_rate: number;
  };
  charts: {
    user_growth: Array<{
      date: string;
      count: number;
    }>;
    request_volume: Array<{
      hour: string;
      count: number;
    }>;
  };
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

/**
 * Response interface for audit logs
 */
export interface AuditLogsResponseDto {
  logs: Array<{
    id: string;
    action: string;
    user_uuid?: string;
    user_email?: string;
    ip_address: string;
    user_agent: string;
    timestamp: string;
    details?: Record<string, any>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
} 