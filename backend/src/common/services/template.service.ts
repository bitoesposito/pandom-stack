import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface EmailTemplateData {
  [key: string]: string | number | boolean;
}

export type EmailTemplateType = 'verification' | 'reset';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly templateCache = new Map<string, string>();

  /**
   * Get templates directory path
   * @returns string - Path to templates directory
   */
  private getTemplatesPath(): string {
    // In Docker, use absolute path to src directory
    return path.join(process.cwd(), 'src', 'common', 'templates');
  }

  /**
   * Load and cache a template
   * @param templateName - Name of the template file
   * @returns Promise<string> - Template content
   */
  private async loadTemplate(templateName: string): Promise<string> {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      const templatesPath = this.getTemplatesPath();
      const templatePath = path.join(templatesPath, `${templateName}.template.html`);
      
      this.logger.debug(`Loading template from: ${templatePath}`);
      
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Cache the template
      this.templateCache.set(templateName, templateContent);
      
      this.logger.debug(`Template loaded: ${templateName}`);
      return templateContent;
    } catch (error) {
      this.logger.error(`Failed to load template: ${templateName}`, error);
      throw new Error(`Template not found: ${templateName}`);
    }
  }

  /**
   * Replace variables in template with provided data
   * @param template - Template content
   * @param data - Data to replace variables with
   * @returns string - Processed template
   */
  private replaceVariables(template: string, data: EmailTemplateData): string {
    let processedTemplate = template;
    
    // Replace all variables in format {{variableName}}
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      processedTemplate = processedTemplate.replace(placeholder, String(value));
    }
    
    return processedTemplate;
  }

  /**
   * Get processed email template
   * @param templateType - Type of email template
   * @param data - Data to inject into template
   * @returns Promise<string> - Processed HTML template
   */
  async getEmailTemplate(templateType: EmailTemplateType, data: EmailTemplateData): Promise<string> {
    try {
      const template = await this.loadTemplate(templateType);
      const processedTemplate = this.replaceVariables(template, data);
      
      this.logger.debug(`Template processed: ${templateType}`);
      return processedTemplate;
    } catch (error) {
      this.logger.error(`Failed to process template: ${templateType}`, error);
      throw error;
    }
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear();
    this.logger.debug('Template cache cleared');
  }

  /**
   * Get available template types
   * @returns Promise<string[]> - List of available template names
   */
  async getAvailableTemplates(): Promise<string[]> {
    try {
      const templatesPath = this.getTemplatesPath();
      const files = await fs.readdir(templatesPath);
      return files
        .filter(file => file.endsWith('.template.html'))
        .map(file => file.replace('.template.html', ''));
    } catch (error) {
      this.logger.error('Failed to get available templates', error);
      return [];
    }
  }
} 