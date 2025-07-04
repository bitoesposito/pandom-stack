import { Component, OnInit } from '@angular/core';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { SecurityService, SecuritySession, SecurityLog } from '../../services/security.service';
import { ResilienceService } from '../../services/resilience.service';
import { AdminService } from '../../services/admin.service';
import { DialogModule } from 'primeng/dialog';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../services/notification.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SystemStatusResponse } from '../../models/resilience.models';
import { SystemMetricsResponse } from '../../models/admin.models';

@Component({
  selector: 'app-user-profile',
  imports: [
    NavBarComponent,
    CommonModule,
    TabsModule,
    ButtonModule,
    DialogModule,
    RouterModule,
    TranslateModule,
    ToastModule,
    TableModule,
    TagModule,
    TooltipModule
  ],
  providers: [MessageService, NotificationService],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {
  userProfile: any = null;
  user: any = null;
  sessions: SecuritySession[] = [];
  securityLogs: SecurityLog[] = [];
  systemStatus: SystemStatusResponse | null = null;
  isLoadingSystemStatus: boolean = false;
  adminMetrics: SystemMetricsResponse | null = null;
  isLoadingAdminMetrics: boolean = false;
  isEditDialogVisible: boolean = false; 
  isDownloadDialogVisible: boolean = false;
  isDeleteDialogVisible: boolean = false;
  isSecurityLogsDialogVisible: boolean = false;
  isDownloading: boolean = false;
  isChangePasswordDialogVisible: boolean = false;
  isProcessing: boolean = false;
  isLoadingSecurityLogs: boolean = false;
  securityLogsPage: number = 1;
  securityLogsRows: number = 10;
  securityLogsTotal: number = 0;
  auditLogs: any[] = [];
  isAuditLogsDialogVisible: boolean = false;
  isLoadingAuditLogs: boolean = false;
  auditLogsPage: number = 1;
  auditLogsRows: number = 10;
  auditLogsTotal: number = 0;

  get activeSessionsCount(): number {
    return this.sessions.filter(session => session.is_active).length;
  }

  constructor(
    private authService: AuthService,
    private securityService: SecurityService,
    private resilienceService: ResilienceService,
    private adminService: AdminService,
    private router: Router,
    private translateService: TranslateService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadSessions();
    
    // Test notification - remove this after testing
    // setTimeout(() => {
    //   this.notificationService.handleSuccess('profile.download.success');
    // }, 2000);
  }

  private loadUserProfile() {
    this.authService.getCurrentUser().subscribe({
      next: (data) => {
        this.user = data.data.user;
        this.userProfile = data.data.profile;
        console.log('Dati profilo auth:', this.user);
        console.log('Dati profilo utente:', this.userProfile);
        
        // Load admin data if user is admin
        if (this.user?.role === 'admin') {
          this.loadSystemStatus();
          this.loadAdminMetrics();
        }
      },
      error: (err) => {
        console.error('Errore nel recupero del profilo:', err);
      }
    });
  }

  private loadSessions() {
    this.securityService.getSessions().subscribe({
      next: (data: any) => {
        this.sessions = data.data.sessions || [];
        console.log('Sessions loaded:', this.sessions);
      },
      error: (err: any) => {
        console.error('Errore nel recupero delle sessioni:', err);
      }
    });
  }

  loadSecurityLogs(page: number = 1, rows: number = 10) {
    this.isLoadingSecurityLogs = true;
    this.securityService.getSecurityLogs(page, rows).subscribe({
      next: (data: any) => {
        this.securityLogs = data.data.logs || [];
        this.securityLogsTotal = data.data.pagination?.total || 0;
        this.securityLogsPage = data.data.pagination?.page || page;
        this.securityLogsRows = data.data.pagination?.limit || rows;
        console.log('Security logs loaded:', this.securityLogs);
        this.isLoadingSecurityLogs = false;
      },
      error: (err: any) => {
        console.error('Errore nel recupero dei log di sicurezza:', err);
        this.notificationService.handleError(err, 'profile.security-logs.error');
        this.isLoadingSecurityLogs = false;
      }
    });
  }

  loadSystemStatus() {
    this.isLoadingSystemStatus = true;
    this.resilienceService.getSystemStatus().subscribe({
      next: (data: any) => {
        this.systemStatus = data.data;
        console.log('System status loaded:', this.systemStatus);
        this.isLoadingSystemStatus = false;
      },
      error: (err: any) => {
        console.error('Errore nel recupero dello stato del sistema:', err);
        this.notificationService.handleError(err, 'profile.system-status.error');
        this.isLoadingSystemStatus = false;
      }
    });
  }

  loadAdminMetrics() {
    this.isLoadingAdminMetrics = true;
    this.adminService.getMetrics().subscribe({
      next: (data: any) => {
        this.adminMetrics = data.data;
        console.log('Admin metrics loaded:', this.adminMetrics);
        this.isLoadingAdminMetrics = false;
      },
      error: (err: any) => {
        console.error('Errore nel recupero delle metriche admin:', err);
        this.notificationService.handleError(err, 'profile.administration.error');
        this.isLoadingAdminMetrics = false;
      }
    });
  }

  toggleDialog(key: string) {
    switch (key) {
      case 'edit':
        this.isEditDialogVisible = !this.isEditDialogVisible;
        break;
      case 'download':
        this.isDownloadDialogVisible = !this.isDownloadDialogVisible;
        break;
      case 'delete':
        this.isDeleteDialogVisible = !this.isDeleteDialogVisible;
        break;
      case 'security':
        this.isSecurityLogsDialogVisible = !this.isSecurityLogsDialogVisible;
        if (this.isSecurityLogsDialogVisible) {
          this.loadSecurityLogs(1, this.securityLogsRows);
        }
        break;
      case 'change-password':
        this.isChangePasswordDialogVisible = !this.isChangePasswordDialogVisible;
        break;
      case 'audit-logs':
        this.isAuditLogsDialogVisible = !this.isAuditLogsDialogVisible;
        if (this.isAuditLogsDialogVisible) {
          this.loadAuditLogs(1, this.auditLogsRows);
        }
        break;
      default:
        break;
    }
  }

  /**
   * Download personal data from the server
   */
  downloadPersonalData(): void {
    this.isDownloading = true;
    this.securityService.downloadData().subscribe({
      next: (response) => {
        this.isDownloading = false;
        if (response.success && response.data?.download_url) {
          // Close the modal first
          this.isDownloadDialogVisible = false;
          
          // Create a temporary link to download the file
          const link = document.createElement('a');
          link.href = response.data.download_url;
          link.download = `personal-data-${new Date().toISOString().split('T')[0]}.${response.data.format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Show success notification after modal is closed
          setTimeout(() => {
            this.notificationService.handleSuccess('profile.download.success');
          }, 100);
        } else {
          this.notificationService.handleError(response, 'profile.download.error');
        }
      },
      error: (error) => {
        this.isDownloading = false;
        this.notificationService.handleError(error, 'profile.download.error');
      }
    });
  }

  /**
   * Request password change by sending reset email
   */
  requestPasswordChange(): void {
    if (!this.user?.email) {
      this.notificationService.handleError(null, 'profile.change-password.no-email');
      return;
    }

    this.isProcessing = true;
    
    this.authService.forgotPassword({ email: this.user.email }).subscribe({
      next: (response) => {
        if (response.success) {
          // Close the modal first
          this.isChangePasswordDialogVisible = false;
          
          // Show success notification
          this.notificationService.handleSuccess('profile.change-password.email-sent');
          
          // Keep isProcessing true until redirect
          // Logout the user and redirect after toast is shown
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/reset'], { 
              queryParams: { email: this.user.email } 
            });
          }, 2000);
        } else {
          this.isProcessing = false;
          this.notificationService.handleError(response, 'profile.change-password.email-failed');
        }
      },
      error: (error) => {
        this.isProcessing = false;
        this.notificationService.handleError(error, 'profile.change-password.email-failed');
      }
    });
  }

  /**
   * Delete user account
   */
  deleteAccount(): void {
    this.isProcessing = true;
    
    this.securityService.deleteAccount().subscribe({
      next: (response) => {
        if (response.success) {
          // Close the modal first
          this.isDeleteDialogVisible = false;
          
          // Show success notification
          this.notificationService.handleSuccess('profile.delete-account.success');
          
          // Keep isProcessing true until redirect
          // Logout the user and redirect after toast is shown
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.isProcessing = false;
          this.notificationService.handleError(response, 'profile.delete-account.failed');
        }
      },
      error: (error) => {
        this.isProcessing = false;
        this.notificationService.handleError(error, 'profile.delete-account.failed');
      }
    });
  }

  /**
   * Get the translated action name
   */
  getActionName(action: string): string {
    const actionMap: { [key: string]: string } = {
      'login': 'profile.security-logs.actions.login',
      'logout': 'profile.security-logs.actions.logout',
      'password_change': 'profile.security-logs.actions.password-change',
      'password_reset': 'profile.security-logs.actions.password-reset',
      'account_deletion': 'profile.security-logs.actions.account-deletion',
      'session_creation': 'profile.security-logs.actions.session-creation',
      'session_termination': 'profile.security-logs.actions.session-termination',
      'failed_login': 'profile.security-logs.actions.failed-login',
      'suspicious_activity': 'profile.security-logs.actions.suspicious-activity',
      'USER_LOGIN_SUCCESS': 'profile.security-logs.actions.USER_LOGIN_SUCCESS',
      'USER_LOGOUT': 'profile.security-logs.actions.USER_LOGOUT',
      'USER_RESET_PASSWORD': 'profile.security-logs.actions.USER_RESET_PASSWORD',
      'USER_CHANGE_PASSWORD': 'profile.security-logs.actions.USER_CHANGE_PASSWORD',
      'USER_DELETE_ACCOUNT': 'profile.security-logs.actions.USER_DELETE_ACCOUNT',
      'SUSPICIOUS_ACTIVITY': 'profile.security-logs.actions.SUSPICIOUS_ACTIVITY',
      'DATA_EXPORT': 'profile.security-logs.actions.DATA_EXPORT',
      'SESSION_CREATION': 'profile.security-logs.actions.SESSION_CREATION',
      'SESSION_TERMINATION': 'profile.security-logs.actions.SESSION_TERMINATION'
    };
    
    return actionMap[action] || action;
  }

  /**
   * Get the severity for the status tag
   */
  getSecurityStatusSeverity(success: boolean): string {
    return success ? 'success' : 'danger';
  }

  /**
   * Get the translated status text
   */
  getStatusText(success: boolean): string {
    return success ? 'profile.security-logs.status.success' : 'profile.security-logs.status.failed';
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  /**
   * Truncate user agent for display
   */
  truncateUserAgent(userAgent: string): string {
    return userAgent.length > 50 ? userAgent.substring(0, 50) + '...' : userAgent;
  }

  /**
   * Get system status severity for PrimeNG tag
   * @param status - Service status
   * @returns Severity string
   */
  getSystemStatusSeverity(status: 'healthy' | 'degraded' | 'down'): string {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'danger';
      default:
        return 'info';
    }
  }

  /**
   * Format uptime from seconds to human readable format
   * @param uptime - Uptime in seconds
   * @returns Formatted uptime string
   */
  formatUptime(uptime: number): string {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Format timestamp to local date string
   * @param timestamp - ISO timestamp
   * @returns Formatted date string
   */
  formatSystemTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  loadAuditLogs(page: number = 1, rows: number = 10) {
    console.log('🔍 [DEBUG] loadAuditLogs chiamata con:', { page, rows });
    this.isLoadingAuditLogs = true;
    
    this.adminService.getAuditLogs(page, rows).subscribe({
      next: (data: any) => {
        console.log('✅ [DEBUG] Risposta API audit logs:', data);
        console.log('📊 [DEBUG] Dati ricevuti:', {
          logs: data.data?.logs,
          logsLength: data.data?.logs?.length,
          pagination: data.data?.pagination,
          total: data.data?.pagination?.total,
          page: data.data?.pagination?.page,
          limit: data.data?.pagination?.limit
        });
        
        const logs = data.data?.logs || [];
        const total = data.data?.pagination?.total || 0;
        const currentPage = data.data?.pagination?.page || page;
        
        console.log('🔢 [DEBUG] Valori estratti:', {
          logs,
          logsLength: logs.length,
          total,
          currentPage,
          requestedPage: page
        });
        
        // Se la pagina corrente è > 1, non ci sono risultati ma il totale è > 0, torno alla prima pagina
        if (page > 1 && logs.length === 0 && total > 0) {
          console.log('⚠️ [DEBUG] Pagina vuota ma totale > 0, torno alla prima pagina');
          this.notificationService.handleInfo('profile.audit-logs.no-results-on-page');
          this.loadAuditLogs(1, rows);
          return;
        }
        
        console.log('✅ [DEBUG] Aggiornamento stato con:', {
          logsLength: logs.length,
          total,
          page: currentPage,
          rows
        });
        
        this.auditLogs = logs;
        this.auditLogsTotal = total;
        this.auditLogsPage = currentPage;
        this.auditLogsRows = rows;
        this.isLoadingAuditLogs = false;
        
        console.log('🎯 [DEBUG] Stato finale:', {
          auditLogsLength: this.auditLogs.length,
          auditLogsTotal: this.auditLogsTotal,
          auditLogsPage: this.auditLogsPage,
          auditLogsRows: this.auditLogsRows
        });
      },
      error: (err: any) => {
        console.error('❌ [DEBUG] Errore nel caricamento audit logs:', err);
        console.error('❌ [DEBUG] Dettagli errore:', {
          status: err.status,
          message: err.message,
          error: err.error
        });
        this.isLoadingAuditLogs = false;
        this.notificationService.handleError(err, 'profile.audit-logs.error');
      }
    });
  }

  onAuditLogsPageChange(event: any) {
    console.log('🔄 [DEBUG] onAuditLogsPageChange chiamata con evento:', event);
    console.log('📄 [DEBUG] Dettagli evento paginazione:', {
      page: event.page,
      first: event.first,
      rows: event.rows,
      pageCount: event.pageCount
    });
    
    // Calcola la pagina corrente basandosi su first e rows
    // PrimeNG usa first (indice 0-based) e rows per calcolare la pagina
    const newPage = Math.floor(event.first / event.rows) + 1;
    console.log('🎯 [DEBUG] Pagina calcolata:', newPage, '(first:', event.first, 'rows:', event.rows, ')');
    
    // Verifica che la pagina sia valida
    if (isNaN(newPage) || newPage < 1) {
      console.error('❌ [DEBUG] Pagina non valida calcolata:', newPage);
      return;
    }
    
    this.loadAuditLogs(newPage, event.rows);
  }

  onSecurityLogsPageChange(event: any) {
    console.log('🔄 [DEBUG] onSecurityLogsPageChange chiamata con evento:', event);
    console.log('📄 [DEBUG] Dettagli evento paginazione:', {
      page: event.page,
      first: event.first,
      rows: event.rows,
      pageCount: event.pageCount
    });
    
    // Calcola la pagina corrente basandosi su first e rows
    // PrimeNG usa first (indice 0-based) e rows per calcolare la pagina
    const newPage = Math.floor(event.first / event.rows) + 1;
    console.log('🎯 [DEBUG] Pagina calcolata:', newPage, '(first:', event.first, 'rows:', event.rows, ')');
    
    // Verifica che la pagina sia valida
    if (isNaN(newPage) || newPage < 1) {
      console.error('❌ [DEBUG] Pagina non valida calcolata:', newPage);
      return;
    }
    
    this.loadSecurityLogs(newPage, event.rows);
  }

  getAuditActionName(action: string): string {
    const actionMap: { [key: string]: string } = {
      'USER_LOGIN_SUCCESS': 'profile.security-logs.actions.USER_LOGIN_SUCCESS',
      'USER_LOGOUT': 'profile.security-logs.actions.USER_LOGOUT',
      'USER_RESET_PASSWORD': 'profile.security-logs.actions.USER_RESET_PASSWORD',
      'USER_CHANGE_PASSWORD': 'profile.security-logs.actions.USER_CHANGE_PASSWORD',
      'USER_DELETE_ACCOUNT': 'profile.security-logs.actions.USER_DELETE_ACCOUNT',
      'SUSPICIOUS_ACTIVITY': 'profile.security-logs.actions.SUSPICIOUS_ACTIVITY',
      'DATA_EXPORT': 'profile.security-logs.actions.DATA_EXPORT',
      'SESSION_CREATION': 'profile.security-logs.actions.SESSION_CREATION',
      'SESSION_TERMINATION': 'profile.security-logs.actions.SESSION_TERMINATION',
      // fallback
      'login': 'profile.security-logs.actions.login',
      'logout': 'profile.security-logs.actions.logout',
      'password_change': 'profile.security-logs.actions.password-change',
      'password_reset': 'profile.security-logs.actions.password-reset',
      'account_deletion': 'profile.security-logs.actions.account-deletion',
      'session_creation': 'profile.security-logs.actions.session-creation',
      'session_termination': 'profile.security-logs.actions.session-termination',
      'failed_login': 'profile.security-logs.actions.failed-login',
      'suspicious_activity': 'profile.security-logs.actions.suspicious-activity',
    };
    return actionMap[action] || action;
  }
}
