import { User } from './user.models';

/**
 * Login request data
 * Contains email, password and remember me option
 */
export interface LoginRequestData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Register request data
 * Contains email and password
 */
export interface RegisterRequestData {
  email: string;
  password: string;
}

/**
 * Login response data
 * Contains the JWT token, refresh token and essential user data
 */
export interface LoginResponseData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    uuid: string;
    email: string;
    role: string;
  };
}

/**
 * Password recovery response
 * Returns the token expiration time
 */
export interface RecoverResponse {
  expiresIn: number; // Duration in seconds (10 minutes)
}

/**
 * Token verification request body
 * Requires token and new password
 */
export interface VerifyRequest {
  token: string;
  password: string;
}

/**
 * Email verification request body
 * Requires only the verification token
 */
export interface VerifyEmailRequest {
  token: string;
}

/**
 * Resend verification email request body
 * Requires only the email address
 */
export interface ResendVerificationRequest {
  email: string;
}

/**
 * Forgot password request body
 * Requires only the email address
 */
export interface ForgotPasswordRequest {
  email: string;
}