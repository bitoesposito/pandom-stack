import { User } from './user.models';

/**
 * Login request data
 * Contains email and password
 */
export interface LoginRequestData {
  email: string;
  password: string;
}

/**
 * Login response data
 * Contains the JWT token and essential user data
 */
export interface LoginResponseData {
  access_token: string;
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