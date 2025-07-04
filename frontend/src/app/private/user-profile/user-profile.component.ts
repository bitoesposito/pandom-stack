import { Component, OnInit } from '@angular/core';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { SecurityService, SecuritySession, SecurityLog } from '../../services/security.service';
import { DialogModule } from 'primeng/dialog';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../services/notification.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

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
  isEditDialogVisible: boolean = false; 
  isDownloadDialogVisible: boolean = false;
  isDeleteDialogVisible: boolean = false;
  isSecurityLogsDialogVisible: boolean = false;
  isDownloading: boolean = false;
  isChangePasswordDialogVisible: boolean = false;
  isProcessing: boolean = false;
  isLoadingSecurityLogs: boolean = false;

  get activeSessionsCount(): number {
    return this.sessions.filter(session => session.is_active).length;
  }

  constructor(
    private authService: AuthService,
    private securityService: SecurityService,
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

  private loadSecurityLogs() {
    this.isLoadingSecurityLogs = true;
    this.securityService.getSecurityLogs().subscribe({
      next: (data: any) => {
        this.securityLogs = data.data.logs || [];
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
          this.loadSecurityLogs();
        }
        break;
      case 'change-password':
        this.isChangePasswordDialogVisible = !this.isChangePasswordDialogVisible;
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
  getStatusSeverity(success: boolean): string {
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
}
