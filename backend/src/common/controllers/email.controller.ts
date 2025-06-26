import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MailService } from '../services/mail.service';
import { TemplateService, EmailTemplateData } from '../services/template.service';
import { ApiResponseDto } from '../common.interface';

interface TestEmailDto {
  to: string;
  templateType: 'verification' | 'reset';
  data: EmailTemplateData;
}

/**
 * Controller for email template management and testing
 * Only accessible to authenticated users
 */
@Controller('email')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(
    private readonly mailService: MailService,
    private readonly templateService: TemplateService
  ) {}

  /**
   * Get available email templates
   * GET /email/templates
   */
  @Get('templates')
  async getAvailableTemplates(): Promise<ApiResponseDto<string[]>> {
    try {
      const templates = await this.mailService.getAvailableTemplates();
      return ApiResponseDto.success(templates, 'Available templates retrieved successfully');
    } catch (error) {
      return ApiResponseDto.error('Failed to retrieve templates', error);
    }
  }

  /**
   * Test email template
   * POST /email/test
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testEmail(@Body() testEmailDto: TestEmailDto): Promise<ApiResponseDto<null>> {
    try {
      await this.mailService.sendEmail({
        to: testEmailDto.to,
        templateType: testEmailDto.templateType,
        data: testEmailDto.data
      });

      return ApiResponseDto.success(null, 'Test email sent successfully');
    } catch (error) {
      return ApiResponseDto.error('Failed to send test email', error);
    }
  }

  /**
   * Clear template cache
   * POST /email/clear-cache
   */
  @Post('clear-cache')
  @HttpCode(HttpStatus.OK)
  async clearCache(): Promise<ApiResponseDto<null>> {
    try {
      this.mailService.clearTemplateCache();
      return ApiResponseDto.success(null, 'Template cache cleared successfully');
    } catch (error) {
      return ApiResponseDto.error('Failed to clear cache', error);
    }
  }
} 