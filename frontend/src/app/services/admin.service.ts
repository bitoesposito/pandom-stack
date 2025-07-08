import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-base.models';
import { 
  SystemMetricsResponse, 
  DetailedSystemMetricsResponse, 
  UserManagementResponse, 
  AuditLogsResponse,
  GetMetricsResponse,
  GetDetailedMetricsResponse,
  GetUserManagementResponse,
  GetAuditLogsResponse,
  DeleteUserResponse
} from '../models/admin.models';
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
  getMetrics(): Observable<GetMetricsResponse> {
    return this.http.get<GetMetricsResponse>(`${this.API_URL}/admin/metrics`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get detailed system metrics
   * @returns Observable with detailed system metrics
   */
  getDetailedMetrics(): Observable<GetDetailedMetricsResponse> {
    return this.http.get<GetDetailedMetricsResponse>(`${this.API_URL}/admin/metrics/detailed`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get user management data
   * @param page - Page number
   * @param limit - Items per page
   * @param search - Search query
   * @returns Observable with user management data
   */
  getUsers(page: number = 1, limit: number = 10, search?: string): Observable<GetUserManagementResponse> {
    let url = `${this.API_URL}/admin/users?page=${page}&limit=${limit}`;
    if (search && search.trim() !== '') {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get<GetUserManagementResponse>(url, {
      headers: this.getHeaders()
    });
  }

  /**
   * Suspend a user
   * @param uuid - User UUID
   * @returns Observable with suspension response
   */
  suspendUser(uuid: string): Observable<DeleteUserResponse> {
    return this.http.put<DeleteUserResponse>(`${this.API_URL}/admin/users/${uuid}/suspend`, {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * Delete a user
   * @param uuid - User UUID
   * @returns Observable with deletion response
   */
  deleteUser(uuid: string): Observable<DeleteUserResponse> {
    return this.http.delete<DeleteUserResponse>(`${this.API_URL}/admin/users/${uuid}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get audit logs
   * @param page - Page number
   * @param limit - Items per page
   * @returns Observable with audit logs
   */
  getAuditLogs(page: number = 1, limit: number = 50): Observable<GetAuditLogsResponse> {
    const url = `${this.API_URL}/admin/audit-logs?page=${page}&limit=${limit}`;
    
    return this.http.get<GetAuditLogsResponse>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap((response: any) => {
        // Handle successful response if needed
      }),
      catchError((error: any) => {
        // Handle error appropriately
        console.error('Error fetching audit logs:', error);
        throw error;
      })
    );
  }
} 