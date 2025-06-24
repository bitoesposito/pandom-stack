import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  HttpCode, 
  HttpStatus, 
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseUUIDPipe,
  Param,
  NotFoundException,
  Put,
  Delete,
  Request,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, EditUserDto, DeleteUserDto } from './users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/auth.interface';
import { UserRole } from '../auth/auth.interface';
import { ApiResponseDto } from '../common/common.interface';
import { Logger } from '@nestjs/common';

/**
 * Controller handling user-related HTTP requests
 * Provides endpoints for user management operations
 */
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * Health check endpoint
   * Returns application status
   * 
   * @returns Promise<ApiResponseDto<{ status: string, timestamp: string }>>
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck() {
    return ApiResponseDto.success(
      { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'pandom-api'
      }, 
      'Application is running'
    );
  }

  /**
   * Creates a new user in the system
   * Requires admin role
   * 
   * @param createUserDto - Data transfer object containing user creation details
   * @returns Promise<ApiResponseDto<{ email: string }>> - Response containing created user's email
   * @throws ForbiddenException - If user doesn't have admin role
   */
  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto) {
    this.logger.log('Creating new user', { 
      email: createUserDto.email,
      timestamp: new Date().toISOString()
    });

    if (!createUserDto.email) {
      this.logger.warn('Create user attempt with missing email');
      throw new BadRequestException('Email is required');
    }

    const response = await this.usersService.createUser(createUserDto);
    
    if (!response.success) {
      this.logger.error('Failed to create user', { 
        email: createUserDto.email,
        error: response.message
      });
    } else {
      this.logger.log('User created successfully', { 
        email: createUserDto.email,
        timestamp: new Date().toISOString()
      });
    }

    return response;
  }

  /**
   * Retrieves a list of all non-admin users
   * Requires admin role
   * Returns only essential user information
   * 
   * @returns Promise<ApiResponseDto<Array<{ uuid: string, email: string, created_at: Date }>>>
   * @throws ForbiddenException - If user doesn't have admin role
   */
  @Get('list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @HttpCode(HttpStatus.OK)
  async listUsers() {
    this.logger.log('Retrieving users list', { timestamp: new Date().toISOString() });
    
    const response = await this.usersService.findAll();
    
    if (!response.success) {
      this.logger.error('Failed to retrieve users list', { 
        error: response.message,
        timestamp: new Date().toISOString()
      });
      return response;
    }

    // Sanitize user data to return only essential information
    const formattedUsers = response.data.map(user => ({
      uuid: user.profile_uuid,
      email: user.email,
      is_configured: user.is_configured,
      created_at: user.created_at,
    }));

    this.logger.log('Users list retrieved successfully', { 
      count: formattedUsers.length,
      timestamp: new Date().toISOString()
    });

    return ApiResponseDto.success(formattedUsers, 'Users list retrieved successfully');
  }

  /**
   * Retrieves a specific user by UUID
   * Requires admin role or ownership of the profile
   * 
   * @param uuid - User's UUID
   * @param req - Request object containing authenticated user
   * @returns Promise<ApiResponseDto<User>> - Response containing user details
   * @throws NotFoundException - If user is not found
   * @throws ForbiddenException - If user doesn't have permission to access the profile
   */
  @Get(':uuid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.user)
  @HttpCode(HttpStatus.OK)
  async getUser(@Param('uuid', ParseUUIDPipe) uuid: string, @Request() req) {
    try {
      // Check if user is admin or is requesting their own profile
      if (req.user.role !== UserRole.admin && req.user.uuid !== uuid) {
        throw new ForbiddenException('You can only access your own profile');
      }

      const user = await this.usersService.findByUuid(uuid);
      return ApiResponseDto.success(user, 'User details retrieved successfully');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Updates a user's profile
   * Requires authentication
   * 
   * @param editUserDto - Data transfer object containing profile update details
   * @param req - Request object containing authenticated user
   * @returns Promise<ApiResponseDto<UserProfile>> - Response containing updated profile
   * @throws ForbiddenException - If user doesn't have permission to update the profile
   */
  @Put('edit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async editUser(@Body() editUserDto: EditUserDto, @Request() req) {
    this.logger.log('Updating user profile', { 
      email: req.user.email,
      timestamp: new Date().toISOString()
    });

    const response = await this.usersService.editUser(req.user.email, editUserDto, req.user);
    
    if (!response.success) {
      this.logger.error('Failed to update profile', { 
        email: req.user.email, 
        error: response.message,
        timestamp: new Date().toISOString()
      });
      return response;
    }

    const profile = response.data;
    const formattedProfile = {
      uuid: profile.uuid,
      display_name: profile.display_name,
      slug: profile.slug,
      avatar_url: profile.avatar_url,
      description: profile.description,
      tags: profile.tags,
      metadata: profile.metadata,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };

    this.logger.log('Profile updated successfully', { 
      profileId: profile.uuid,
      timestamp: new Date().toISOString()
    });

    return ApiResponseDto.success(formattedProfile, 'Profile updated successfully');
  }

  /**
   * Deletes a user and their associated profile
   * Requires authentication
   * 
   * @param deleteUserDto - Data transfer object containing the email of the user to delete
   * @param req - Request object containing the authenticated user
   * @returns Promise<ApiResponseDto<undefined>> - Response indicating success or failure
   * @throws ForbiddenException - If user doesn't have permission to delete
   */
  @Delete('delete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Body() deleteUserDto: DeleteUserDto, @Request() req) {
    this.logger.log('Deleting user', { 
      email: deleteUserDto.email,
      requestingUser: req.user.email,
      timestamp: new Date().toISOString()
    });

    if (!deleteUserDto.email) {
      this.logger.warn('Delete user attempt with missing email');
      throw new BadRequestException('Email is required');
    }

    const response = await this.usersService.deleteUser(deleteUserDto.email, req.user);
    
    if (!response.success) {
      this.logger.error('Failed to delete user', { 
        email: deleteUserDto.email,
        error: response.message,
        timestamp: new Date().toISOString()
      });
    } else {
      this.logger.log('User deleted successfully', { 
        email: deleteUserDto.email,
        timestamp: new Date().toISOString()
      });
    }

    return response;
  }

  /**
   * Retrieves a user profile by slug
   * Public endpoint
   * 
   * @param slug - Profile slug
   * @returns Promise<ApiResponseDto<UserProfile>> - Response containing profile details
   */
  @Get('public/:slug')
  @HttpCode(HttpStatus.OK)
  async getUserBySlug(@Param('slug') slug: string) {
    this.logger.log('Retrieving user profile by slug', { 
      slug,
      timestamp: new Date().toISOString()
    });

    if (!slug || typeof slug !== 'string') {
      this.logger.warn('Invalid slug format', { slug });
      return ApiResponseDto.error('Invalid slug format', HttpStatus.BAD_REQUEST);
    }

    const trimmedSlug = slug.trim();
    if (trimmedSlug === '' || trimmedSlug.toLowerCase() === 'null' || trimmedSlug.toLowerCase() === 'undefined') {
      this.logger.warn('Invalid slug value', { slug: trimmedSlug });
      return ApiResponseDto.error('Invalid slug value', HttpStatus.BAD_REQUEST);
    }

    try {
      const profile = await this.usersService.findByUuid(trimmedSlug);
      
      if (!profile) {
        this.logger.error('Profile not found', { 
          slug: trimmedSlug,
          timestamp: new Date().toISOString()
        });
        return ApiResponseDto.error('Profile not found', HttpStatus.NOT_FOUND);
      }
      
      // Restituisci solo i dati pubblici
      const formattedProfile = {
        uuid: profile.uuid,
        display_name: profile.display_name,
        slug: profile.slug,
        avatar_url: profile.avatar_url,
        description: profile.description,
        tags: profile.tags,
        metadata: profile.metadata
      };

      this.logger.log('User profile retrieved successfully', { 
        slug: trimmedSlug,
        timestamp: new Date().toISOString()
      });

      return ApiResponseDto.success(formattedProfile, 'User profile retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to retrieve user profile', { 
        slug: trimmedSlug,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return ApiResponseDto.error('Profile not found', HttpStatus.NOT_FOUND);
    }
  }
} 