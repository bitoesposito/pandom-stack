import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../common/common.interface';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UpdateProfileDto } from './users.dto';

/**
 * Service handling user profile business logic
 * Manages user profile operations and data access
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
  ) { }

  /**
   * Get user profile by user ID
   * @param userId - User ID
   * @returns Promise<ApiResponseDto<any>>
   */
  async getProfile(userId: string): Promise<ApiResponseDto<any>> {
    try {
      this.logger.log('Getting user profile', { userId });

      // Find user with profile relation
      const user = await this.userRepository.findOne({
        where: { uuid: userId },
        relations: ['profile']
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.profile) {
        throw new NotFoundException('User profile not found');
      }

      // Prepare response data
      const profileData = {
        uuid: user.profile.uuid,
        display_name: user.profile.display_name,
        tags: user.profile.tags || [],
        metadata: user.profile.metadata || {},
        created_at: user.profile.created_at,
        updated_at: user.profile.updated_at
      };

      this.logger.log('Profile retrieved successfully', { userId, profileUuid: user.profile.uuid });
      
      return ApiResponseDto.success(profileData, 'Profile retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get user profile', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update user profile
   * @param userId - User ID
   * @param updateProfileDto - Profile update data
   * @returns Promise<ApiResponseDto<any>>
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<ApiResponseDto<any>> {
    try {
      this.logger.log('Updating user profile', { userId, data: updateProfileDto });

      // Find user with profile relation
      const user = await this.userRepository.findOne({
        where: { uuid: userId },
        relations: ['profile']
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.profile) {
        throw new NotFoundException('User profile not found');
      }

      // Validate input data
      this.validateProfileData(updateProfileDto);

      // Update profile fields
      if (updateProfileDto.display_name !== undefined) {
        user.profile.display_name = updateProfileDto.display_name;
      }

      if (updateProfileDto.tags !== undefined) {
        // Ensure tags is an array and filter out empty values
        user.profile.tags = Array.isArray(updateProfileDto.tags) 
          ? updateProfileDto.tags.filter(tag => tag && tag.trim().length > 0)
          : [];
      }

      if (updateProfileDto.metadata !== undefined) {
        // Merge existing metadata with new metadata
        user.profile.metadata = {
          ...user.profile.metadata,
          ...updateProfileDto.metadata
        };
      }

      // Save updated profile
      const updatedProfile = await this.userProfileRepository.save(user.profile);

      // Update user's is_configured flag if display_name is set
      if (updateProfileDto.display_name && !user.is_configured) {
        user.is_configured = true;
        await this.userRepository.save(user);
      }

      // Prepare response data
      const profileData = {
        uuid: updatedProfile.uuid,
        display_name: updatedProfile.display_name,
        tags: updatedProfile.tags || [],
        metadata: updatedProfile.metadata || {},
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at
      };

      this.logger.log('Profile updated successfully', { 
        userId, 
        profileUuid: updatedProfile.uuid,
        updatedFields: Object.keys(updateProfileDto)
      });
      
      return ApiResponseDto.success(profileData, 'Profile updated successfully');
    } catch (error) {
      this.logger.error('Failed to update user profile', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Validate profile update data
   * @param updateProfileDto - Profile update data
   */
  private validateProfileData(updateProfileDto: UpdateProfileDto): void {
    // Validate display_name length
    if (updateProfileDto.display_name !== undefined) {
      if (updateProfileDto.display_name.length > 100) {
        throw new BadRequestException('Display name cannot exceed 100 characters');
      }
    }

    // Validate tags
    if (updateProfileDto.tags !== undefined) {
      if (!Array.isArray(updateProfileDto.tags)) {
        throw new BadRequestException('Tags must be an array');
      }

      if (updateProfileDto.tags.length > 20) {
        throw new BadRequestException('Cannot have more than 20 tags');
      }

      // Check for duplicate tags
      const uniqueTags = new Set(updateProfileDto.tags);
      if (uniqueTags.size !== updateProfileDto.tags.length) {
        throw new BadRequestException('Tags must be unique');
      }

      // Validate individual tag length
      for (const tag of updateProfileDto.tags) {
        if (tag && tag.length > 50) {
          throw new BadRequestException('Individual tags cannot exceed 50 characters');
        }
      }
    }

    // Validate metadata
    if (updateProfileDto.metadata !== undefined) {
      if (typeof updateProfileDto.metadata !== 'object' || updateProfileDto.metadata === null) {
        throw new BadRequestException('Metadata must be an object');
      }

      // Check metadata size (prevent excessive data)
      const metadataSize = JSON.stringify(updateProfileDto.metadata).length;
      if (metadataSize > 10000) { // 10KB limit
        throw new BadRequestException('Metadata size cannot exceed 10KB');
      }
    }
  }
} 