/**
 * Models for Admin API responses
 * Handles system metrics, user management, and administrative functions
 */

export interface SystemMetricsResponse {
  overview: {
    total_users: number;
    active_users: number;
    new_users_today: number;
    total_requests: number;
    error_rate: number;
  };
  charts: {
    user_growth: Array<{date: string, count: number}>;
    request_volume: Array<{hour: string, count: number}>;
  };
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

export interface DetailedSystemMetricsResponse {
  system: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    errorRate: number;
    requestsPerMinute: number;
    uniqueUsers: number;
    topEndpoints: Array<{path: string, count: number}>;
    errorBreakdown: Array<{statusCode: number, count: number}>;
  };
  hourly: Array<{
    hour: string;
    requests: number;
    errors: number;
    avgResponseTime: number;
    uniqueUsers: number;
  }>;
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
  timestamp: string;
}

export interface UserManagementResponse {
  users: Array<{
    uuid: string;
    email: string;
    role: string;
    is_verified: boolean;
    created_at: string;
    last_login_at?: string;
    profile?: {
      uuid?: string;
      display_name?: string;
      bio?: string;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface AuditLogsResponse {
  logs: Array<{
    id: string;
    action: string;
    user_uuid: string;
    user_email: string;
    ip_address: string;
    user_agent: string;
    timestamp: string;
    details: any;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
} 