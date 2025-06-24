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
   * Stores the JWT token in localStorage
   * @param token JWT token to store
   */
  setToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  /**
   * Retrieves the stored JWT token
   * @returns The stored JWT token or null if not found
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Removes the stored JWT token
   */
  removeToken(): void {
    localStorage.removeItem('access_token');
  }

  /**
   * Checks if user is authenticated
   * @returns boolean indicating if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
} 