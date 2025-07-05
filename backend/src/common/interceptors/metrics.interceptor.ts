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
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
} 