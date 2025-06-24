import { IsString, IsOptional, Length, IsArray, IsObject } from 'class-validator';

/**
 * Data Transfer Object for updating user profile
 * Aligned with simplified database structure
 */
export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Length(1, 100, { message: 'Display name must be between 1 and 100 characters' })
  display_name?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
} 