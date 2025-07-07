import { Component, OnInit } from '@angular/core';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { SecurityService } from '../../services/security.service';
import { SecuritySession, SecurityLog } from '../../models/security.models';
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
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { SystemStatusResponse, BackupResponse } from '../../models/resilience.models';
import { SystemMetricsResponse, DetailedSystemMetricsResponse } from '../../models/admin.models';

@Component({
  selector: 'app-user-profile',
  imports: [
    NavBarComponent,
    CommonModule,
    TabViewModule,
    ButtonModule,
    DialogModule,
    RouterModule,
    TranslateModule,
    ToastModule,
    TableModule,
    TagModule,
    TooltipModule,
    InputTextModule,
    FormsModule,
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
  detailedMetrics: DetailedSystemMetricsResponse | null = null;
  isLoadingAdminMetrics: boolean = false;
  isLoadingDetailedMetrics: boolean = false;
  
  // Backup management
  backups: BackupResponse[] = [];
  isLoadingBackups: boolean = false;
  isCreatingBackup: boolean = false;
  isRestoringBackup: boolean = false;
  selectedBackupForRestore: BackupResponse | null = null;
  isRestoreDialogVisible: boolean = false;
  isBackupManagementDialogVisible: boolean = false;
  backupsPage: number = 1;
  backupsRows: number = 10;
  backupsTotal: number = 0;
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
  
  // User management
  users: any[] = [];
  isUserManagementDialogVisible: boolean = false;
  isLoadingUsers: boolean = false;
  usersPage: number = 1;
  usersRows: number = 10;
  usersTotal: number = 0;
  userSearchQuery: string = '';
  isDeletingUser: boolean = false;
  selectedUserForAction: any = null;

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
  }

  /**
   * Handle tab change events
   * @param event - Tab change event
   */
  onTabChange(event: any): void {
    // event.index contiene l'indice del tab attivo
    console.log('[DEBUG] Tab changed, event:', event);
    if (event.index === 1 && this.user?.role === 'admin') {
      console.log('[DEBUG] Trigger loadAdminData (tab 1, admin)');
      this.loadAdminData();
    }
    if (event.index === 2 && this.user?.role === 'admin' && !this.systemStatus) {
      console.log('[DEBUG] Trigger loadSystemStatus (tab 2, admin)');
      this.loadSystemStatus();
    }
  }

  private loadUserProfile() {
    this.authService.getCurrentUser().subscribe({
      next: (data) => {
        if (data.data) {
          this.user = data.data.user;
          this.userProfile = data.data.profile;
          console.log('[DEBUG] user:', this.user);
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
        if (data.data) {
          this.sessions = data.data.sessions || [];
          console.log('Sessions loaded:', this.sessions);
        }
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
        if (data.data) {
          this.securityLogs = data.data.logs || [];
          this.securityLogsTotal = data.data.pagination?.total || 0;
          this.securityLogsPage = data.data.pagination?.page || page;
          this.securityLogsRows = data.data.pagination?.limit || rows;
          console.log('Security logs loaded:', this.securityLogs);
        }
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
    console.log('[DEBUG] Chiamo loadSystemStatus');
    this.isLoadingSystemStatus = true;
    this.resilienceService.getSystemStatus().subscribe({
      next: (data: any) => {
        console.log('[DEBUG] Risposta system status:', data);
        if (data.data) {
          this.systemStatus = data.data;
        }
        this.isLoadingSystemStatus = false;
      },
      error: (err: any) => {
        console.error('[DEBUG] Errore nel recupero dello stato del sistema:', err);
        this.notificationService.handleError(err, 'profile.system-status.error');
        this.isLoadingSystemStatus = false;
      }
    });
  }

  loadAdminData() {
    console.log('[DEBUG] Chiamo loadAdminData');
    this.isLoadingAdminMetrics = true;
    this.isLoadingDetailedMetrics = true;
    
    // Carica metriche base
    this.adminService.getMetrics().subscribe({
      next: (data: any) => {
        console.log('[DEBUG] Risposta admin metrics:', data);
        if (data.data) {
          this.adminMetrics = data.data;
        }
        this.isLoadingAdminMetrics = false;
      },
      error: (err: any) => {
        console.error('[DEBUG] Errore nel recupero delle metriche admin:', err);
        this.notificationService.handleError(err, 'profile.administration.error');
        this.isLoadingAdminMetrics = false;
      }
    });

    // Carica metriche dettagliate
    this.adminService.getDetailedMetrics().subscribe({
      next: (data: any) => {
        console.log('[DEBUG] Risposta detailed metrics:', data);
        if (data.data) {
          this.detailedMetrics = data.data;
        }
        this.isLoadingDetailedMetrics = false;
      },
      error: (err: any) => {
        console.error('[DEBUG] Errore nel recupero delle metriche dettagliate:', err);
        this.notificationService.handleError(err, 'profile.administration.error');
        this.isLoadingDetailedMetrics = false;
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
      case 'user-management':
        console.log('Opening user management dialog');
        this.isUserManagementDialogVisible = !this.isUserManagementDialogVisible;
        if (this.isUserManagementDialogVisible) {
          this.loadUsers(1, this.usersRows);
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
      'SESSION_TERMINATION': 'profile.security-logs.actions.SESSION_TERMINATION',
      'USER_VERIFY_EMAIL': 'profile.security-logs.actions.USER_VERIFY_EMAIL',
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
    return 'profile.security-logs.status.' + (success ? 'SUCCESS' : 'FAILED');
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

  // User Management Methods
  loadUsers(page: number = 1, rows: number = 10) {
    console.log('Loading users with page:', page, 'rows:', rows, 'search:', this.userSearchQuery);
    this.isLoadingUsers = true;
    this.adminService.getUsers(page, rows, this.userSearchQuery).subscribe({
      next: (data: any) => {
        if (data.data) {
          this.users = data.data.users || [];
          this.usersTotal = data.data.pagination?.total || 0;
          this.usersPage = data.data.pagination?.page || page;
          this.usersRows = data.data.pagination?.limit || rows;
          console.log('Users loaded:', this.users);
        }
        this.isLoadingUsers = false;
      },
      error: (err: any) => {
        console.error('Errore nel caricamento degli utenti:', err);
        this.notificationService.handleError(err, 'profile.user-management.error');
        this.isLoadingUsers = false;
      }
    });
  }

  onUsersPageChange(event: any) {
    const newPage = Math.floor(event.first / event.rows) + 1;
    if (isNaN(newPage) || newPage < 1) {
      return;
    }
    this.loadUsers(newPage, event.rows);
  }

  onUserSearch() {
    // Reset to first page when searching
    this.loadUsers(1, this.usersRows);
  }

  deleteUser(user: any) {
    this.selectedUserForAction = user;
    this.isDeletingUser = true;
    
    this.adminService.deleteUser(user.uuid).subscribe({
      next: (data: any) => {
        this.notificationService.handleSuccess('profile.user-management.delete-success');
        this.loadUsers(this.usersPage, this.usersRows); // Reload current page
        this.isDeletingUser = false;
        this.selectedUserForAction = null;
      },
      error: (err: any) => {
        console.error('Errore nella cancellazione dell\'utente:', err);
        this.notificationService.handleError(err, 'profile.user-management.delete-error');
        this.isDeletingUser = false;
        this.selectedUserForAction = null;
      }
    });
  }

  getRoleSeverity(role: string): string {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'user':
        return 'info';
      default:
        return 'secondary';
    }
  }

  getUserDisplayName(user: any): string {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else if (user.last_name) {
      return user.last_name;
    } else if (user.profile?.display_name) {
      return user.profile.display_name;
    } else {
      return user.email;
    }
  }

  // Backup Management Methods
  loadBackups(page: number = 1, rows: number = 10) {
    this.isLoadingBackups = true;
    this.resilienceService.listBackups(page, rows).subscribe({
      next: (data: any) => {
        if (data.data) {
          this.backups = data.data.backups || [];
          this.backupsTotal = data.data.pagination?.total || 0;
          this.backupsPage = data.data.pagination?.page || page;
          this.backupsRows = data.data.pagination?.limit || rows;
          console.log('Backups loaded:', this.backups);
        }
        this.isLoadingBackups = false;
      },
      error: (err: any) => {
        console.error('Errore nel caricamento dei backup:', err);
        this.notificationService.handleError(err, 'profile.system-status.backup-list-failed');
        this.isLoadingBackups = false;
      }
    });
  }

  createBackup() {
    this.isCreatingBackup = true;
    this.resilienceService.createBackup().subscribe({
      next: (data: any) => {
        this.notificationService.handleSuccess('profile.system-status.backup-created');
        this.loadBackups(this.backupsPage, this.backupsRows); // Reload current page
        this.isCreatingBackup = false;
      },
      error: (err: any) => {
        console.error('Errore nella creazione del backup:', err);
        this.notificationService.handleError(err, 'profile.system-status.backup-creation-failed');
        this.isCreatingBackup = false;
      }
    });
  }

  restoreBackup(backup: BackupResponse) {
    this.selectedBackupForRestore = backup;
    this.isRestoreDialogVisible = true;
  }

  confirmRestoreBackup() {
    if (!this.selectedBackupForRestore) return;
    
    this.isRestoringBackup = true;
    this.resilienceService.restoreBackup(this.selectedBackupForRestore.backup_id).subscribe({
      next: (data: any) => {
        this.notificationService.handleSuccess('profile.system-status.backup-restored');
        this.loadBackups(this.backupsPage, this.backupsRows); // Reload current page
        this.isRestoringBackup = false;
        this.isRestoreDialogVisible = false;
        this.selectedBackupForRestore = null;
      },
      error: (err: any) => {
        console.error('Errore nel ripristino del backup:', err);
        this.notificationService.handleError(err, 'profile.system-status.backup-restore-failed');
        this.isRestoringBackup = false;
        this.isRestoreDialogVisible = false;
        this.selectedBackupForRestore = null;
      }
    });
  }

  cancelRestoreBackup() {
    this.isRestoreDialogVisible = false;
    this.selectedBackupForRestore = null;
  }

  openBackupManagementDialog() {
    this.isBackupManagementDialogVisible = true;
    this.loadBackups(1, this.backupsRows); // Load first page
  }

  onBackupsPageChange(event: any) {
    const newPage = Math.floor(event.first / event.rows) + 1;
    if (isNaN(newPage) || newPage < 1) {
      return;
    }
    this.loadBackups(newPage, event.rows);
  }

  formatBackupSize(size: number): string {
    if (size === 0) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;
    
    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }
    
    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  }

  formatBackupDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}
