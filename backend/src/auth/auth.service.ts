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
import { MailService } from '../common/services/mail.service';

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
    private readonly mailService: MailService,
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

      // Generate verification token
      const verificationToken = this.generateSecureToken();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user profile (always create one, even with empty display_name)
      const profile = this.userProfileRepository.create({
        display_name: registerDto.display_name || undefined,
        tags: [],
        metadata: {}
      });
      await this.userProfileRepository.save(profile);

      // Create user
      const user = this.userRepository.create({
        email: registerDto.email,
        password_hash: passwordHash,
        role: UserRole.user,
        is_active: true,
        is_verified: false,
        is_configured: !!registerDto.display_name,
        profile_uuid: profile.uuid,
        verification_token: verificationToken,
        verification_expires: verificationExpiry
      });

      await this.userRepository.save(user);

      // Send verification email
      try {
        await this.mailService.sendVerificationEmail(registerDto.email, verificationToken);
        this.logger.log('Verification email sent successfully', { email: registerDto.email });
      } catch (emailError) {
        this.logger.error('Failed to send verification email', { email: registerDto.email, error: emailError });
        // Don't fail registration if email fails, just log it
      }

      // Log verification token to console for development
      this.logger.log('Verification OTP generated', { 
        email: registerDto.email, 
        otp: verificationToken,
        expiresAt: verificationExpiry 
      });

      this.logger.log('User registered successfully', { email: registerDto.email });
      
      return ApiResponseDto.success({
        user: {
          uuid: user.uuid,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          is_verified: user.is_verified,
          is_configured: user.is_configured,
          profile_uuid: user.profile_uuid
        }
      }, 'User registered successfully. Please check your email to verify your account.');
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

      // Profile is always created now, so always include it
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

      // Profile is always created now, so always include it
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
        throw new BadRequestException('Invalid verification OTP code');
      }

      // Check if token is expired
      if (user.verification_expires && user.verification_expires < new Date()) {
        throw new BadRequestException('Verification OTP code has expired');
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

      // Send reset email
      try {
        await this.mailService.sendPasswordResetEmail(user.email, resetToken);
        this.logger.log('Password reset email sent successfully', { email: user.email });
      } catch (emailError) {
        this.logger.error('Failed to send password reset email', { email: user.email, error: emailError });
        // Don't fail the request if email fails, just log it
      }

      // Log reset token to console for development
      this.logger.log('Password reset OTP generated', { 
        email: user.email, 
        otp: resetToken,
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
        throw new BadRequestException('Invalid reset OTP code');
      }

      // Check if token is expired
      if (user.reset_token_expiry && user.reset_token_expiry < new Date()) {
        throw new BadRequestException('Reset OTP code has expired');
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
   * Resend verification email
   * @param email - User email
   * @returns Promise<ApiResponseDto<null>>
   */
  async resendVerificationEmail(email: string): Promise<ApiResponseDto<null>> {
    try {
      const user = await this.userRepository.findOne({
        where: { email }
      });

      if (!user) {
        // Don't reveal if user exists or not for security
        this.logger.log('Verification resend requested for non-existent email', { email });
        return ApiResponseDto.success(null, 'If the email exists, a verification link has been sent');
      }

      if (user.is_verified) {
        throw new BadRequestException('Email is already verified');
      }

      // Generate new verification token
      const verificationToken = this.generateSecureToken();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new verification token
      user.verification_token = verificationToken;
      user.verification_expires = verificationExpiry;
      await this.userRepository.save(user);

      // Send verification email
      try {
        await this.mailService.sendVerificationEmail(user.email, verificationToken);
        this.logger.log('Verification email resent successfully', { email: user.email });
      } catch (emailError) {
        this.logger.error('Failed to resend verification email', { email: user.email, error: emailError });
        throw new BadRequestException('Failed to send verification email');
      }

      // Log verification token to console for development
      this.logger.log('Verification OTP generated', { 
        email: user.email, 
        otp: verificationToken,
        expiresAt: verificationExpiry 
      });

      return ApiResponseDto.success(null, 'Verification email sent successfully');
    } catch (error) {
      this.logger.error('Resend verification email failed', error);
      throw error;
    }
  }

  /**
   * Generate a 6-digit OTP (One-Time Password)
   * @returns string - 6-digit numeric code
   */
  private generateSecureToken(): string {
    // Generate a random 6-digit number
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
  }
}