import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from '../services/mail.service';
import { TemplateService } from '../services/template.service';

@Module({
    imports: [ConfigModule],
    providers: [MailService, TemplateService],
    exports: [MailService, TemplateService]
})
export class MailModule {} 