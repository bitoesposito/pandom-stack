import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    
    // ===== Set security headers =====
    
    // const response = context.switchToHttp().getResponse();
    // response.setHeader('X-Content-Type-Options', 'nosniff');
    // response.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // response.setHeader('X-XSS-Protection', '1; mode=block');
    // response.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://website.com https://website.com");
    // response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return next.handle().pipe(
      map(data => data)
    );
  }
} 