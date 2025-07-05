import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-base.models';
import { 
  SystemStatusResponse, 
  BackupResponse, 
  BackupStatusResponse,
  BackupListResponse,
  GetSystemStatusResponse,
  CreateBackupResponse,
  ListBackupsResponse,
  RestoreBackupResponse,
  GetBackupStatusResponse
} from '../models/resilience.models';
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
  getSystemStatus(): Observable<GetSystemStatusResponse> {
    return this.http.get<GetSystemStatusResponse>(`${this.API_URL}/resilience/status`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Create system backup
   * @returns Observable with backup response
   */
  createBackup(): Observable<CreateBackupResponse> {
    return this.http.post<CreateBackupResponse>(`${this.API_URL}/resilience/backup`, {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * List available backups with pagination
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @returns Observable with backup list and pagination
   */
  listBackups(page: number = 1, limit: number = 10): Observable<ListBackupsResponse> {
    return this.http.get<ListBackupsResponse>(`${this.API_URL}/resilience/backup?page=${page}&limit=${limit}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Restore system from backup
   * @param backupId - Backup ID to restore from
   * @returns Observable with restore response
   */
  restoreBackup(backupId: string): Observable<RestoreBackupResponse> {
    return this.http.post<RestoreBackupResponse>(`${this.API_URL}/resilience/backup/${backupId}/restore`, {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get backup automation status
   * @returns Observable with backup status
   */
  getBackupStatus(): Observable<GetBackupStatusResponse> {
    return this.http.get<GetBackupStatusResponse>(`${this.API_URL}/resilience/backup/status`, {
      headers: this.getHeaders()
    });
  }
} 