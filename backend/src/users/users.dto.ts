import { IsEmail, IsNotEmpty, IsString, IsOptional, IsBoolean, Length, Matches, IsArray, IsObject } from 'class-validator';

/**
 * Data Transfer Object for creating a new user
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

/**
 * Data Transfer Object for editing user profile
 */
export class EditUserDto {
  @IsString()
  @IsOptional()
  @Length(1, 100, { message: 'Display name must be between 1 and 100 characters' })
  display_name?: string;

  @IsString()
  @IsOptional()
  @Length(1, 100, { message: 'Slug must be between 1 and 100 characters' })
  @Matches(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    { message: 'Slug can only contain lowercase letters, numbers, and hyphens' }
  )
  slug?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Data Transfer Object for deleting a user
 */
export class DeleteUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
} 