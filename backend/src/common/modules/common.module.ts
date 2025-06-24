import { Module, Global } from '@nestjs/common';
import { LoggerService } from '../services/logger.service';
import { SessionService } from '../services/session.service';
import { MailService } from '../services/mail.service';
import { SecurityHeadersInterceptor } from '../interceptors/security-headers.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Global()
@Module({
  providers: [
    LoggerService,
    SessionService,
    MailService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityHeadersInterceptor,
    },
  ],
  exports: [
    LoggerService,
    SessionService,
    MailService,
    SecurityHeadersInterceptor,
  ],
})
export class CommonModule {} 