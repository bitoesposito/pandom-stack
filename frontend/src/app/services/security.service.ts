import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-base.models';
import {
  SecuritySession,
  SecurityLog,
  SecurityLogsResponse,
  SessionsResponse,
  DownloadDataResponse,
  GetSecurityLogsResponse,
  GetSessionsResponse,
  DownloadDataApiResponse,
  DeleteAccountResponse
} from '../models/security.models';
import { AuthService } from './auth.service';

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
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Observable with security logs
   */
  getSecurityLogs(page: number = 1, limit: number = 10): Observable<GetSecurityLogsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    return this.http.get<GetSecurityLogsResponse>(`${this.API_URL}/security/logs?${params}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get user active sessions
   * @returns Observable with user sessions
   */
  getSessions(): Observable<GetSessionsResponse> {
    return this.http.get<GetSessionsResponse>(`${this.API_URL}/security/sessions`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Download user data (GDPR compliance)
   * @returns Observable with download data response
   */
  downloadData(): Observable<DownloadDataApiResponse> {
    return this.http.get<DownloadDataApiResponse>(`${this.API_URL}/security/download-data`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Delete user account
   * @returns Observable with deletion response
   */
  deleteAccount(): Observable<DeleteAccountResponse> {
    return this.http.delete<DeleteAccountResponse>(`${this.API_URL}/security/delete-account`, {
      headers: this.getHeaders()
    });
  }
} 