import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;
    private frontendUrl: string;
    private fromEmail: string;

    constructor(private configService: ConfigService) {
        this.initializeTransporter();
        this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
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

    async sendEmail(to: string, token: string, type: 'verification' | 'reset'): Promise<void> {
        try {
            const subject = type === 'verification' 
                ? 'Verify your email address'
                : 'Reset your password';

            const verificationUrl = `${this.frontendUrl}/verify?token=${token}`;
            const resetUrl = `${this.frontendUrl}/verify?token=${token}`;
            const url = type === 'verification' ? verificationUrl : resetUrl;

            const html = `
                <body
                    style="font-family: Arial, sans-serif;color: #f8fafc; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #2c3e50;">${subject}</h1>
                    <p>For ${type === 'verification' ? 'verify your account' : 'reset your password'}, click the button below:</p>
                    <p style="margin: 20px 0;">
                        <a href="${url}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${type === 'verification' ? 'Verify account' : 'Reset password'}</a>
                    </p>
                    <hr>
                    <p style="color: #94a3b8; font-size: 0.9em;">If you didn't request this, you can safely ignore this email.</p>
                </body>
            `;

            await this.transporter.sendMail({
                from: this.configService.get<string>('SMTP_USER'),
                to,
                subject,
                html,
            });

            this.logger.log(`Email sent successfully to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error);
            throw error;
        }
    }
} 