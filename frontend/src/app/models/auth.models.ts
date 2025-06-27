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