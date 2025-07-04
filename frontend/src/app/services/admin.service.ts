import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { SystemMetricsResponse, UserManagementResponse, AuditLogsResponse } from '../models/admin.models';
import { AuthService } from './auth.service';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
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
   * Get system metrics
   * @returns Observable with system metrics
   */
  getMetrics(): Observable<ApiResponse<SystemMetricsResponse>> {
    return this.http.get<ApiResponse<SystemMetricsResponse>>(`${this.API_URL}/admin/metrics`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get user management data
   * @param page - Page number
   * @param limit - Items per page
   * @returns Observable with user management data
   */
  getUsers(page: number = 1, limit: number = 10): Observable<ApiResponse<UserManagementResponse>> {
    return this.http.get<ApiResponse<UserManagementResponse>>(`${this.API_URL}/admin/users?page=${page}&limit=${limit}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Suspend a user
   * @param uuid - User UUID
   * @returns Observable with suspension response
   */
  suspendUser(uuid: string): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.API_URL}/admin/users/${uuid}/suspend`, {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * Delete a user
   * @param uuid - User UUID
   * @returns Observable with deletion response
   */
  deleteUser(uuid: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/admin/users/${uuid}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get audit logs
   * @param page - Page number
   * @param limit - Items per page
   * @returns Observable with audit logs
   */
  getAuditLogs(page: number = 1, limit: number = 50): Observable<ApiResponse<AuditLogsResponse>> {
    console.log('🌐 [DEBUG] AdminService.getAuditLogs chiamata con:', { page, limit });
    const url = `${this.API_URL}/admin/audit-logs?page=${page}&limit=${limit}`;
    console.log('🔗 [DEBUG] URL richiesta:', url);
    
    return this.http.get<ApiResponse<AuditLogsResponse>>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap((response) => {
        console.log('📡 [DEBUG] Risposta API audit logs:', response);
      }),
      catchError((error) => {
        console.error('💥 [DEBUG] Errore API audit logs:', error);
        throw error;
      })
    );
  }
} 