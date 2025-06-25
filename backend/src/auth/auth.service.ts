import { Injectable, Logger, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ApiResponseDto } from '../common/common.interface';
import { User } from './entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { LoginResponse, UserRole } from './auth.interface';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './auth.dto';

/**
 * Service handling authentication business logic
 * Manages user authentication, JWT token generation, and password recovery
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Register a new user
   * @param registerDto - Registration data
   * @returns Promise<ApiResponseDto<any>>
   */
  async register(registerDto: RegisterDto): Promise<ApiResponseDto<any>> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: registerDto.email }
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

      // Create user profile if display_name is provided
      let profile: UserProfile | null = null;
      if (registerDto.display_name) {
        profile = this.userProfileRepository.create({
          display_name: registerDto.display_name,
          tags: [],
          metadata: {}
        });
        await this.userProfileRepository.save(profile);
      }

      // Create user
      const user = this.userRepository.create({
        email: registerDto.email,
        password_hash: passwordHash,
        role: UserRole.user,
        is_active: true,
        is_verified: false,
        is_configured: !!registerDto.display_name,
        profile_uuid: profile?.uuid || null
      });

      await this.userRepository.save(user);

      this.logger.log('User registered successfully', { email: registerDto.email });
      
      return ApiResponseDto.success({
        user: {
          uuid: user.uuid,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          is_verified: user.is_verified,
          is_configured: user.is_configured
        }
      }, 'User registered successfully');
    } catch (error) {
      this.logger.error('Registration failed', error);
      throw error;
    }
  }

  /**
   * Authenticates a user and generates a JWT token
   * @param loginDto - Login credentials
   * @returns Promise<ApiResponseDto<LoginResponse>>
   */
  async login(loginDto: LoginDto): Promise<ApiResponseDto<LoginResponse>> {
    try {
      // Find user by email
      const user = await this.userRepository.findOne({
        where: { email: loginDto.email },
        relations: ['profile']
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (!user.is_active) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Update last login
      user.last_login_at = new Date();
      await this.userRepository.save(user);

      // Generate JWT tokens
      const payload = {
        sub: user.uuid,
        email: user.email,
        role: user.role
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      // Prepare response
      const response: LoginResponse = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600, // 1 hour
      user: {
          uuid: user.uuid,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          is_verified: user.is_verified,
          is_configured: user.is_configured,
          last_login_at: user.last_login_at.toISOString()
      }
    };

      // Add profile data if exists
      if (user.profile) {
        response.profile = {
          uuid: user.profile.uuid,
          display_name: user.profile.display_name,
          tags: user.profile.tags
        };
      }

      this.logger.log('User logged in successfully', { email: user.email });
      
      return ApiResponseDto.success(response, 'Login successful');
    } catch (error) {
      this.logger.error('Login failed', error);
      throw error;
    }
  }

  /**
   * Perform user logout
   * @param userId - User ID to logout
   * @returns Promise<ApiResponseDto<null>>
   */
  async logout(userId: string): Promise<ApiResponseDto<null>> {
    try {
      // In a real application, you might want to:
      // 1. Add the token to a blacklist
      // 2. Update user's last logout time
      // 3. Clear any active sessions
      
      this.logger.log('User logged out', { userId });
    return ApiResponseDto.success(null, 'Logout successful');
    } catch (error) {
      this.logger.error('Logout failed', error);
      throw error;
    }
  }

  /**
   * Get current user data
   * @param userId - User ID
   * @returns Promise<ApiResponseDto<any>>
   */
  async getMe(userId: string): Promise<ApiResponseDto<any>> {
    try {
      const user = await this.userRepository.findOne({
        where: { uuid: userId },
        relations: ['profile']
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const response: any = {
        user: {
          uuid: user.uuid,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          is_verified: user.is_verified,
          is_configured: user.is_configured,
          last_login_at: user.last_login_at?.toISOString(),
          created_at: user.created_at.toISOString(),
          updated_at: user.updated_at.toISOString()
        }
      };

      if (user.profile) {
        response.profile = {
          uuid: user.profile.uuid,
          display_name: user.profile.display_name,
          tags: user.profile.tags,
          metadata: user.profile.metadata,
          created_at: user.profile.created_at.toISOString(),
          updated_at: user.profile.updated_at.toISOString()
        };
      }

      return ApiResponseDto.success(response, 'User data retrieved successfully');
    } catch (error) {
      this.logger.error('Get user data failed', error);
      throw error;
    }
  }

  /**
   * Verify email via token
   * @param verifyEmailDto - Email verification data
   * @returns Promise<ApiResponseDto<null>>
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<ApiResponseDto<null>> {
    try {
      // Find user by verification token
      const user = await this.userRepository.findOne({
        where: { verification_token: verifyEmailDto.token }
      });

      if (!user) {
        throw new BadRequestException('Invalid verification token');
      }

      // Check if token is expired
      if (user.verification_expires && user.verification_expires < new Date()) {
        throw new BadRequestException('Verification token has expired');
      }

      // Update user verification status
      user.is_verified = true;
      user.verification_token = null;
      user.verification_expires = null;
      await this.userRepository.save(user);

      this.logger.log('Email verified successfully', { email: user.email });
      
    return ApiResponseDto.success(null, 'Email verified successfully');
    } catch (error) {
      this.logger.error('Email verification failed', error);
      throw error;
    }
  }

  /**
   * Send password reset link
   * @param forgotPasswordDto - Forgot password data
   * @returns Promise<ApiResponseDto<any>>
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<ApiResponseDto<any>> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: forgotPasswordDto.email }
      });

      if (!user) {
        // Don't reveal if user exists or not for security
        this.logger.log('Password reset requested for non-existent email', { email: forgotPasswordDto.email });
        return ApiResponseDto.success(null, 'If the email exists, a password reset link has been sent');
      }

      // Generate reset token
      const resetToken = this.generateSecureToken();
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with reset token
      user.reset_token = resetToken;
      user.reset_token_expiry = resetTokenExpiry;
      await this.userRepository.save(user);

      // TODO: Send email with reset link
      // In a real application, you would send an email here
      this.logger.log('Password reset token generated', { 
        email: user.email, 
        resetToken,
        expiresAt: resetTokenExpiry 
      });

      return ApiResponseDto.success(null, 'If the email exists, a password reset link has been sent');
    } catch (error) {
      this.logger.error('Forgot password failed', error);
      throw error;
    }
  }

  /**
   * Reset password via token
   * @param resetPasswordDto - Reset password data
   * @returns Promise<ApiResponseDto<null>>
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<ApiResponseDto<null>> {
    try {
      // Find user by reset token
      const user = await this.userRepository.findOne({
        where: { reset_token: resetPasswordDto.token }
      });

      if (!user) {
        throw new BadRequestException('Invalid reset token');
      }

      // Check if token is expired
      if (user.reset_token_expiry && user.reset_token_expiry < new Date()) {
        throw new BadRequestException('Reset token has expired');
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(resetPasswordDto.password, saltRounds);

      // Update user password and clear reset token
      user.password_hash = passwordHash;
      user.reset_token = null;
      user.reset_token_expiry = null;
      await this.userRepository.save(user);

      this.logger.log('Password reset successfully', { email: user.email });
      
    return ApiResponseDto.success(null, 'Password reset successfully');
    } catch (error) {
      this.logger.error('Password reset failed', error);
      throw error;
    }
  }

  /**
   * Generate a secure random token
   * @returns string
   */
  private generateSecureToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }
}