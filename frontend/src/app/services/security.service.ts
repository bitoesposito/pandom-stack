import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { AuthService } from './auth.service';

export interface SecuritySession {
  id: string;
  device: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface SecurityLog {
  id: string;
  action: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  success: boolean;
  details?: Record<string, any>;
}

export interface SecurityLogsResponse {
  logs: SecurityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface SessionsResponse {
  sessions: SecuritySession[];
}

export interface DownloadDataResponse {
  download_url: string;
  expires_at: string;
  file_size: number;
  format: 'json' | 'csv' | 'xml';
}

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private readonly API_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Get user security logs
   * @returns Observable with security logs
   */
  getSecurityLogs(): Observable<ApiResponse<SecurityLogsResponse>> {
    return this.http.get<ApiResponse<SecurityLogsResponse>>(`${this.API_URL}/security/logs`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get user active sessions
   * @returns Observable with user sessions
   */
  getSessions(): Observable<ApiResponse<SessionsResponse>> {
    return this.http.get<ApiResponse<SessionsResponse>>(`${this.API_URL}/security/sessions`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Download user data (GDPR compliance)
   * @returns Observable with download data response
   */
  downloadData(): Observable<ApiResponse<DownloadDataResponse>> {
    return this.http.get<ApiResponse<DownloadDataResponse>>(`${this.API_URL}/security/download-data`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Delete user account
   * @returns Observable with deletion response
   */
  deleteAccount(): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/security/delete-account`, {
      headers: this.getHeaders()
    });
  }
} 