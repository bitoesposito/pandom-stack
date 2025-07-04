import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { SystemStatusResponse, BackupResponse, BackupStatusResponse } from '../models/resilience.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ResilienceService {
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
   * Get system status (healthcheck)
   * @returns Observable with system status
   */
  getSystemStatus(): Observable<ApiResponse<SystemStatusResponse>> {
    return this.http.get<ApiResponse<SystemStatusResponse>>(`${this.API_URL}/resilience/status`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Create system backup
   * @returns Observable with backup response
   */
  createBackup(): Observable<ApiResponse<BackupResponse>> {
    return this.http.post<ApiResponse<BackupResponse>>(`${this.API_URL}/resilience/backup`, {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * List available backups with pagination
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @returns Observable with backup list and pagination
   */
  listBackups(page: number = 1, limit: number = 10): Observable<ApiResponse<{backups: BackupResponse[], pagination: {page: number, limit: number, total: number}}>> {
    return this.http.get<ApiResponse<{backups: BackupResponse[], pagination: {page: number, limit: number, total: number}}>>(`${this.API_URL}/resilience/backup?page=${page}&limit=${limit}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Restore system from backup
   * @param backupId - Backup ID to restore from
   * @returns Observable with restore response
   */
  restoreBackup(backupId: string): Observable<ApiResponse<BackupResponse>> {
    return this.http.post<ApiResponse<BackupResponse>>(`${this.API_URL}/resilience/backup/${backupId}/restore`, {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get backup automation status
   * @returns Observable with backup status
   */
  getBackupStatus(): Observable<ApiResponse<BackupStatusResponse>> {
    return this.http.get<ApiResponse<BackupStatusResponse>>(`${this.API_URL}/resilience/backup/status`, {
      headers: this.getHeaders()
    });
  }
} 