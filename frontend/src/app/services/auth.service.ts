import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.models';
import { LoginRequestData, LoginResponseData, RecoverResponse, VerifyRequest } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Authenticates a user with email and password
   * @param credentials Login credentials
   * @returns Observable with login response containing JWT token and user data
   */
  login(credentials: LoginRequestData): Observable<ApiResponse<LoginResponseData>> {
    return this.http.post<ApiResponse<LoginResponseData>>(`${this.API_URL}/auth/login`, credentials);
  }

  /**
   * Initiates password recovery process
   * @param email User's email address
   * @returns Observable with recovery response containing token expiration time
   */
  recoverPassword(email: string): Observable<ApiResponse<RecoverResponse>> {
    return this.http.post<ApiResponse<RecoverResponse>>(`${this.API_URL}/auth/recover`, { email });
  }
  
  /**
   * Verifies recovery token and updates password
   * @param data Token and new password
   * @returns Observable with verification response
   */
  verifyToken(data: VerifyRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/auth/verify`, data);
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
} 