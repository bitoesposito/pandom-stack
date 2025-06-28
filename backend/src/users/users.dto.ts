import { IsString, IsOptional, Length, IsArray, IsObject } from 'class-validator';

/**
 * Data Transfer Object for updating user profile
 * Aligned with simplified database structure
 */
export class UpdateProfileDto {
  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
} 