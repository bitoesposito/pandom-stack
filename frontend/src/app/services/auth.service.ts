import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.models';
import { LoginRequestData, LoginResponseData, RecoverResponse, VerifyRequest, RegisterRequestData, VerifyEmailRequest, ResendVerificationRequest, ForgotPasswordRequest } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Registers a new user
   * @param registrationData Registration data including email, password and optional display name
   * @returns Observable with registration response
   */
  register(registrationData: RegisterRequestData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/auth/register`, registrationData);
  }

  /**
   * Authenticates a user with email and password
   * @param credentials Login credentials
   * @returns Observable with login response containing JWT token and user data
   */
  login(credentials: LoginRequestData): Observable<ApiResponse<LoginResponseData>> {
    return this.http.post<ApiResponse<LoginResponseData>>(`${this.API_URL}/auth/login`, credentials);
  }

  /**
   * Verifies email with verification token
   * @param data Verification token
   * @returns Observable with verification response
   */
  verifyEmail(data: VerifyEmailRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/auth/verify`, data);
  }

  /**
   * Resends verification email
   * @param data Email address
   * @returns Observable with resend response
   */
  resendVerification(data: ResendVerificationRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/auth/resend-verification`, data);
  }

  /**
   * Initiates password recovery process
   * @param data Forgot password data containing email
   * @returns Observable with recovery response
   */
  forgotPassword(data: ForgotPasswordRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/auth/forgot-password`, data);
  }

  /**
   * Resets password using OTP
   * @param data Reset password data containing OTP and new password
   * @returns Observable with reset response
   */
  resetPassword(data: { otp: string; password: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/auth/reset-password`, data);
  }

  /**
   * Stores the JWT token based on remember me setting
   * @param token JWT token to store
   */
  setToken(token: string): void {
    const rememberMe = localStorage.getItem('remember_me') === 'true';
    if (rememberMe) {
      localStorage.setItem('access_token', token);
    } else {
      sessionStorage.setItem('access_token', token);
    }
  }

  /**
   * Stores the refresh token based on remember me setting
   * @param refreshToken Refresh token to store
   */
  setRefreshToken(refreshToken: string): void {
    const rememberMe = localStorage.getItem('remember_me') === 'true';
    if (rememberMe) {
      localStorage.setItem('refresh_token', refreshToken);
    } else {
      sessionStorage.setItem('refresh_token', refreshToken);
    }
  }

  /**
   * Retrieves the stored JWT token
   * @returns The stored JWT token or null if not found
   */
  getToken(): string | null {
    // Check localStorage first (remember me), then sessionStorage
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  }

  /**
   * Retrieves the stored refresh token
   * @returns The stored refresh token or null if not found
   */
  getRefreshToken(): string | null {
    // Check localStorage first (remember me), then sessionStorage
    return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
  }

  /**
   * Removes the stored JWT token
   */
  removeToken(): void {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
  }

  /**
   * Removes the stored refresh token
   */
  removeRefreshToken(): void {
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('refresh_token');
  }

  /**
   * Logout user by clearing all authentication data
   */
  logout(): void {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('refresh_token');
    localStorage.removeItem('remember_me');
    // Remove any other auth-related data that might be stored
    localStorage.removeItem('user_data');
  }

  /**
   * Checks if user is authenticated
   * @returns boolean indicating if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Refreshes the access token using the refresh token
   * @returns Observable with new tokens
   */
  refreshToken(): Observable<ApiResponse<LoginResponseData>> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    return this.http.post<ApiResponse<LoginResponseData>>(`${this.API_URL}/auth/refresh`, { refresh_token: refreshToken });
  }

  /**
   * Ottiene i dati del profilo utente corrente
   * @returns Observable con i dati del profilo
   */
  getCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/auth/me`);
  }
} 