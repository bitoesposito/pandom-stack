import { Injectable, Logger } from '@nestjs/common';
import { AuditService, AuditEventType } from './audit.service';

export interface RequestMetric {
  timestamp: Date;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  userEmail?: string;
}

export interface SystemMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  requestsPerMinute: number;
  uniqueUsers: number;
  topEndpoints: Array<{path: string, count: number}>;
  errorBreakdown: Array<{statusCode: number, count: number}>;
}

export interface HourlyMetrics {
  hour: string;
  requests: number;
  errors: number;
  avgResponseTime: number;
  uniqueUsers: number;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private requestMetrics: RequestMetric[] = [];
  private readonly maxMetricsHistory = 10000; // Keep last 10k requests

  constructor(private readonly auditService: AuditService) {}

  /**
   * Record a new request metric
   */
  recordRequest(metric: RequestMetric): void {
    this.requestMetrics.push(metric);
    
    // Keep only the last maxMetricsHistory metrics
    if (this.requestMetrics.length > this.maxMetricsHistory) {
      this.requestMetrics = this.requestMetrics.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Get system metrics for the last 24 hours
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Filter metrics from last 24 hours
    const recentMetrics = this.requestMetrics.filter(
      metric => metric.timestamp >= twentyFourHoursAgo
    );

    if (recentMetrics.length === 0) {
      return this.getEmptyMetrics();
    }

    const totalRequests = recentMetrics.length;
    const successfulRequests = recentMetrics.filter(m => m.statusCode < 400).length;
    const failedRequests = recentMetrics.filter(m => m.statusCode >= 400).length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const errorRate = failedRequests / totalRequests;
    
    // Calculate requests per minute (last hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const lastHourMetrics = recentMetrics.filter(m => m.timestamp >= oneHourAgo);
    const requestsPerMinute = lastHourMetrics.length / 60;

    // Get unique users
    const uniqueUsers = new Set(recentMetrics.map(m => m.userId).filter(Boolean)).size;

    // Get top endpoints
    const endpointCounts = new Map<string, number>();
    recentMetrics.forEach(m => {
      const key = `${m.method} ${m.path}`;
      endpointCounts.set(key, (endpointCounts.get(key) || 0) + 1);
    });
    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([path, count]) => ({ path, count }))
      .filter(e => e.path !== 'GET /admin/metrics' && e.path !== 'GET /admin/metrics/detailed')
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get error breakdown
    const errorCounts = new Map<number, number>();
    recentMetrics.filter(m => m.statusCode >= 400).forEach(m => {
      errorCounts.set(m.statusCode, (errorCounts.get(m.statusCode) || 0) + 1);
    });
    const errorBreakdown = Array.from(errorCounts.entries())
      .map(([statusCode, count]) => ({ statusCode, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimal places
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
      uniqueUsers,
      topEndpoints,
      errorBreakdown
    };
  }

  /**
   * Get hourly metrics for the last 7 days
   */
  async getHourlyMetrics(): Promise<HourlyMetrics[]> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentMetrics = this.requestMetrics.filter(
      metric => metric.timestamp >= sevenDaysAgo
    );

    const hourlyData: Map<string, HourlyMetrics> = new Map();

    // Initialize hourly buckets for the last 7 days
    for (let i = 0; i < 7 * 24; i++) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.toISOString().slice(0, 13) + ':00:00.000Z';
      
      hourlyData.set(hourKey, {
        hour: hourKey,
        requests: 0,
        errors: 0,
        avgResponseTime: 0,
        uniqueUsers: 0
      });
    }

    // Group metrics by hour
    recentMetrics.forEach(metric => {
      const hourKey = new Date(metric.timestamp.getTime() - metric.timestamp.getMinutes() * 60 * 1000 - metric.timestamp.getSeconds() * 1000 - metric.timestamp.getMilliseconds())
        .toISOString();
      
      const hourData = hourlyData.get(hourKey);
      if (hourData) {
        hourData.requests++;
        if (metric.statusCode >= 400) {
          hourData.errors++;
        }
        hourData.avgResponseTime = (hourData.avgResponseTime * (hourData.requests - 1) + metric.responseTime) / hourData.requests;
      }
    });

    // Calculate unique users per hour
    for (const [hourKey, hourData] of hourlyData) {
      const hourStart = new Date(hourKey);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const hourMetrics = recentMetrics.filter(m => 
        m.timestamp >= hourStart && m.timestamp < hourEnd && m.userId
      );
      
      hourData.uniqueUsers = new Set(hourMetrics.map(m => m.userId)).size;
      hourData.avgResponseTime = Math.round(hourData.avgResponseTime * 100) / 100;
    }

    return Array.from(hourlyData.values())
      .sort((a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime());
  }

  /**
   * Get real-time alerts based on current metrics
   */
  async getAlerts(): Promise<Array<{id: string, type: 'error' | 'warning' | 'info', message: string, timestamp: string, resolved: boolean}>> {
    const metrics = await this.getSystemMetrics();
    const alerts: Array<{id: string, type: 'error' | 'warning' | 'info', message: string, timestamp: string, resolved: boolean}> = [];

    // High error rate alert
    if (metrics.errorRate > 5) {
      alerts.push({
        id: `alert_error_rate_${Date.now()}`,
        type: 'error',
        message: `High error rate detected: ${metrics.errorRate}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    } else if (metrics.errorRate > 2) {
      alerts.push({
        id: `alert_error_rate_${Date.now()}`,
        type: 'warning',
        message: `Elevated error rate: ${metrics.errorRate}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // High response time alert
    if (metrics.averageResponseTime > 2000) {
      alerts.push({
        id: `alert_response_time_${Date.now()}`,
        type: 'warning',
        message: `High average response time: ${metrics.averageResponseTime}ms`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Low activity alert
    if (metrics.requestsPerMinute < 1) {
      alerts.push({
        id: `alert_low_activity_${Date.now()}`,
        type: 'info',
        message: 'Low system activity detected',
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // High load alert
    if (metrics.requestsPerMinute > 100) {
      alerts.push({
        id: `alert_high_load_${Date.now()}`,
        type: 'warning',
        message: `High system load: ${metrics.requestsPerMinute} requests/minute`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    return alerts;
  }

  /**
   * Get user activity metrics from audit logs
   */
  async getUserActivityMetrics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    userGrowth: Array<{date: string, count: number}>;
  }> {
    try {
      // Get all login events from audit logs
      const loginLogs = await this.auditService.getAuditLogsByType(AuditEventType.USER_LOGIN_SUCCESS, 10000);
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Calculate active users (logged in last 24 hours)
      const activeUsers = new Set(
        loginLogs
          .filter(log => new Date(log.timestamp) >= yesterday)
          .map(log => log.user_id)
          .filter(Boolean)
      ).size;

      // Calculate new users today (this would need to be enhanced with registration events)
      const newUsersToday = 0; // Placeholder - would need registration audit logs

      // Calculate user growth for last 7 days
      const userGrowth: Array<{date: string, count: number}> = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const uniqueUsers = new Set(
          loginLogs
            .filter(log => {
              const logDate = new Date(log.timestamp);
              return logDate >= dayStart && logDate < dayEnd;
            })
            .map(log => log.user_id)
            .filter(Boolean)
        ).size;

        userGrowth.push({
          date: dayStart.toISOString().split('T')[0],
          count: uniqueUsers
        });
      }

      return {
        totalUsers: 0, // Would need to get from user repository
        activeUsers,
        newUsersToday,
        userGrowth
      };
    } catch (error) {
      this.logger.error('Failed to get user activity metrics', { error: error.message });
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        userGrowth: []
      };
    }
  }

  private getEmptyMetrics(): SystemMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      requestsPerMinute: 0,
      uniqueUsers: 0,
      topEndpoints: [],
      errorBreakdown: []
    };
  }
} 