import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService, RequestMetric } from '../services/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Extract user information from request
    const user = (request as any).user;
    const userId = user?.uuid;
    const userEmail = user?.email;

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        const metric: RequestMetric = {
          timestamp: new Date(),
          method: request.method,
          path: request.route?.path || request.path,
          statusCode: response.statusCode,
          responseTime,
          userAgent: request.get('User-Agent'),
          ipAddress: this.getClientIp(request),
          userId,
          userEmail
        };

        this.metricsService.recordRequest(metric);
      })
    );
  }

  private getClientIp(request: Request): string {
    // Get IP from various headers and sources
    const forwardedFor = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;
    const remoteAddr = request.connection.remoteAddress || request.socket.remoteAddress;
    
    // If we have X-Forwarded-For, take the first IP (original client)
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      return ips[0];
    }
    
    // If we have X-Real-IP, use it
    if (realIp) {
      return realIp;
    }
    
    // If we have remote address, clean it up
    if (remoteAddr) {
      // Remove IPv6 prefix if present (::ffff:)
      return remoteAddr.replace(/^::ffff:/, '');
    }
    
    return 'unknown';
  }
} 