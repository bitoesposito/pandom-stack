import { Module } from '@nestjs/common';
import { MailModule } from './mail.module';
import { MinioModule } from './minio.module';
import { SessionModule } from './session.module';
import { ImageOptimizerModule } from './image-optimizer.module';
import { EmailController } from '../controllers/email.controller';

@Module({
  imports: [
    MailModule,
    MinioModule,
    SessionModule,
    ImageOptimizerModule,
  ],
  controllers: [EmailController],
  exports: [
    MailModule,
    MinioModule,
    SessionModule,
    ImageOptimizerModule,
  ],
})
export class CommonModule {} 