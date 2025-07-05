import { Module } from '@nestjs/common';
import { MailModule } from './mail.module';
// import { MinioModule } from './minio.module';
import { SessionModule } from './session.module';
import { ImageOptimizerModule } from './image-optimizer.module';
import { EmailController } from '../controllers/email.controller';
import { AuditService } from '../services/audit.service';
import { LoggerService } from '../services/logger.service';
import { MetricsService } from '../services/metrics.service';
import { MetricsInterceptor } from '../interceptors/metrics.interceptor';

@Module({
  imports: [
    MailModule,
    // MinioModule,
    SessionModule,
    ImageOptimizerModule,
  ],
  controllers: [EmailController],
  providers: [AuditService, LoggerService, MetricsService, MetricsInterceptor],
  exports: [
    MailModule,
    // MinioModule,
    SessionModule,
    ImageOptimizerModule,
    AuditService,
    LoggerService,
    MetricsService,
    MetricsInterceptor,
  ],
})
export class CommonModule {} 