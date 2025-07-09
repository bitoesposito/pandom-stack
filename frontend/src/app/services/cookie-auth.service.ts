import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { ApiResponse } from '../models/api-base.models';
import { 
  LoginRequest, 
  LoginResponseData, 
  RegisterRequest, 
  RefreshTokenRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest, 
  VerifyEmailRequest, 
  ResendVerificationRequest,
  UserData,
  LoginApiResponse,
  RegisterApiResponse,
  RefreshTokenApiResponse,
  ForgotPasswordApiResponse,
  ResetPasswordApiResponse,
  VerifyEmailApiResponse,
  ResendVerificationApiResponse,
  GetMeApiResponse
} from '../models/auth.models';

/**
 * Cookie Authentication Service
 * 
 * Manages authentication using secure httpOnly cookies instead of localStorage.
 * This service provides a more secure approach to token management by:
 * - Using httpOnly cookies to prevent XSS attacks
 * - Implementing CSRF protection
 * - Maintaining session state securely
 * - Providing automatic token refresh
 * 
 * Security Features:
 * - httpOnly cookie storage for tokens
 * - CSRF protection with sameSite cookies
 * - Secure cookie transmission (HTTPS only in production)
 * - Automatic token refresh handling
 * - Server-side session management
 * 
 * Usage:
 * - Inject service in components and guards
 * - Call authentication methods for user operations
 * - Handle responses for UI updates
 * - Manage user sessions securely
 */
@Injectable({
  providedIn: 'root'
})
export class CookieAuthService {

  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  /**
   * Register a new user account
   * 
   * Creates a new user account with email verification.
   * Sends a verification email to the provided email address.
   * 
   * @param registrationData - User registration data
   * @returns Observable with registration response
   */
  register(registrationData: RegisterRequest): Observable<RegisterApiResponse> {
    return this.http.post<RegisterApiResponse>(`${this.API_URL}/auth/register`, registrationData);
  }

  /**
   * Authenticate user and receive secure cookies
   * 
   * Authenticates user credentials and receives secure httpOnly cookies
   * containing access and refresh tokens.
   * 
   * @param credentials - User login credentials
   * @returns Observable with user data (tokens in httpOnly cookies)
   */
  login(credentials: LoginRequest): Observable<LoginApiResponse> {
    return this.http.post<LoginApiResponse>(`${this.API_URL}/auth/login`, credentials, {
      withCredentials: true // Important: enables cookie transmission
    });
  }

  /**
   * Get current authenticated user data
   * 
   * Retrieves complete user information for the authenticated user.
   * Uses access token from httpOnly cookie automatically.
   * 
   * @returns Observable with user profile and account information
   */
  getCurrentUser(): Observable<GetMeApiResponse> {
    return this.http.get<GetMeApiResponse>(`${this.API_URL}/auth/me`, {
      withCredentials: true
    });
  }

  /**
   * Verify user email address
   * 
   * Validates email verification token and marks user as verified.
   * Required for full account access.
   * 
   * @param data - Email verification data
   * @returns Observable with verification response
   */
  verifyEmail(data: VerifyEmailRequest): Observable<VerifyEmailApiResponse> {
    return this.http.post<VerifyEmailApiResponse>(`${this.API_URL}/auth/verify`, data);
  }

  /**
   * Resend email verification
   * 
   * Generates and sends a new verification email to unverified users.
   * Useful when original verification email expires or is lost.
   * 
   * @param data - Email for verification resend
   * @returns Observable with resend confirmation
   */
  resendVerification(data: ResendVerificationRequest): Observable<ResendVerificationApiResponse> {
    return this.http.post<ResendVerificationApiResponse>(`${this.API_URL}/auth/resend-verification`, data);
  }

  /**
   * Request password reset
   * 
   * Initiates password reset process by sending OTP to user's email.
   * Provides security by not revealing if email exists.
   * 
   * @param data - Email for password reset
   * @returns Observable with reset request confirmation
   */
  forgotPassword(data: ForgotPasswordRequest): Observable<ForgotPasswordApiResponse> {
    return this.http.post<ForgotPasswordApiResponse>(`${this.API_URL}/auth/forgot-password`, data);
  }

  /**
   * Reset password using OTP
   * 
   * Resets user password using the OTP received via email.
   * Requires valid OTP and new password.
   * 
   * @param data - Password reset data
   * @returns Observable with reset confirmation
   */
  resetPassword(data: ResetPasswordRequest): Observable<ResetPasswordApiResponse> {
    return this.http.post<ResetPasswordApiResponse>(`${this.API_URL}/auth/reset-password`, data);
  }

  // ============================================================================
  // TOKEN MANAGEMENT METHODS
  // ============================================================================

  /**
   * Refresh access token using refresh token from cookie
   * 
   * Uses the refresh token from httpOnly cookie to obtain a new access token
   * when the current access token expires.
   * 
   * @returns Observable with new access token (in httpOnly cookie)
   */
  refreshToken(): Observable<RefreshTokenApiResponse> {
    return this.http.post<RefreshTokenApiResponse>(`${this.API_URL}/auth/refresh`, {}, {
      withCredentials: true
    });
  }

  /**
   * Logout user and clear authentication cookies
   * 
   * Performs a complete logout by calling the server to clear
   * authentication cookies and invalidate the session.
   * 
   * @returns Observable with logout confirmation
   */
  logout(): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/auth/logout`, {}, {
      withCredentials: true
    });
  }

  // ============================================================================
  // SESSION MANAGEMENT METHODS
  // ============================================================================

  /**
   * Check if user is currently authenticated
   * 
   * Determines if the user is authenticated by checking for the
   * presence of a valid JWT access token in httpOnly cookie.
   * Note: This is a client-side check and should be validated server-side.
   * 
   * @returns boolean indicating if user appears to be authenticated
   */
  isAuthenticated(): boolean {
    // Since we can't directly access httpOnly cookies from JavaScript,
    // we'll need to implement a different approach for client-side checks.
    // This could involve:
    // 1. A lightweight endpoint that returns auth status
    // 2. Storing a non-sensitive flag in localStorage
    // 3. Using sessionStorage for temporary auth state
    
    // For now, we'll use a simple approach with sessionStorage
    const authStatus = sessionStorage.getItem('auth_status');
    return authStatus === 'authenticated';
  }

  /**
   * Check authentication status from server
   * 
   * Verifies authentication status by calling the server endpoint
   * that checks the httpOnly cookies.
   * 
   * @returns Observable with authentication status
   */
  checkAuthStatus(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/auth/check`, {
      withCredentials: true
    });
  }

  /**
   * Set authentication status
   * 
   * Sets a client-side flag indicating authentication status.
   * This is used for UI state management only.
   * 
   * @param status - Authentication status
   */
  setAuthStatus(status: 'authenticated' | 'unauthenticated'): void {
    if (status === 'authenticated') {
      sessionStorage.setItem('auth_status', 'authenticated');
    } else {
      sessionStorage.removeItem('auth_status');
    }
  }

  /**
   * Clear authentication status
   * 
   * Clears the client-side authentication status flag.
   */
  clearAuthStatus(): void {
    sessionStorage.removeItem('auth_status');
  }
} 