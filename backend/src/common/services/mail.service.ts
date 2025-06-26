import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { TemplateService, EmailTemplateType, EmailTemplateData } from './template.service';

export interface EmailOptions {
  to: string;
  templateType: EmailTemplateType;
  subject?: string;
  data: EmailTemplateData;
}

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;
    private frontendUrl: string;
    private fromEmail: string;

    constructor(
        private configService: ConfigService,
        private templateService: TemplateService
    ) {
        this.initializeTransporter();
        this.frontendUrl = this.configService.get<string>('FE_URL') || 'http://localhost:4200';
        this.fromEmail = this.configService.get<string>('SMTP_USER') || 'noreply@pandomstack.com';
    }

    private async initializeTransporter() {
        const smtpConfig = {
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT'),
            secure: false,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,
            socketTimeout: 10000,
            debug: false, // Enable debug logs
            logger: false // Enable logger
        };

        this.transporter = nodemailer.createTransport(smtpConfig);

        // Verify connection configuration
        try {
            await this.transporter.verify();
            this.logger.log('SMTP connection verified successfully');
        } catch (error) {
            this.logger.error('SMTP connection verification failed:', error);
            throw error;
        }
    }

    /**
     * Send email using template system
     * @param options - Email options including template type and data
     * @returns Promise<void>
     */
    async sendEmail(options: EmailOptions): Promise<void> {
        try {
            const { to, templateType, subject, data } = options;

            // Get default subject if not provided
            const emailSubject = subject || this.getDefaultSubject(templateType);

            // Get processed template
            const html = await this.templateService.getEmailTemplate(templateType, data);

            await this.transporter.sendMail({
                from: this.fromEmail,
                to,
                subject: emailSubject,
                html,
            });

            this.logger.log(`Email sent successfully to ${to} using template: ${templateType}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${options.to}:`, error);
            throw error;
        }
    }

    /**
     * Send verification email
     * @param to - Recipient email
     * @param token - Verification token
     * @returns Promise<void>
     */
    async sendVerificationEmail(to: string, token: string): Promise<void> {
        await this.sendEmail({
            to,
            templateType: 'verification',
            data: {
                verificationCode: token
            }
        });
    }

    /**
     * Send password reset email
     * @param to - Recipient email
     * @param token - Reset token
     * @returns Promise<void>
     */
    async sendPasswordResetEmail(to: string, token: string): Promise<void> {
        await this.sendEmail({
            to,
            templateType: 'reset',
            data: {
                resetCode: token
            }
        });
    }

    /**
     * Get default subject for template type
     * @param templateType - Type of email template
     * @returns string - Default subject
     */
    private getDefaultSubject(templateType: EmailTemplateType): string {
        const subjects = {
            verification: 'Verify your email address',
            reset: 'Reset your password'
        };

        return subjects[templateType] || 'Message from Pandom Stack';
    }

    /**
     * Get available template types
     * @returns Promise<string[]> - List of available templates
     */
    async getAvailableTemplates(): Promise<string[]> {
        return this.templateService.getAvailableTemplates();
    }

    /**
     * Clear template cache
     */
    clearTemplateCache(): void {
        this.templateService.clearCache();
    }
} 