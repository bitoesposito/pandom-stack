import { Component, OnInit } from '@angular/core';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { SecurityService, SecuritySession } from '../../services/security.service';
import { DialogModule } from 'primeng/dialog';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-profile',
  imports: [
    NavBarComponent,
    CommonModule,
    TabsModule,
    ButtonModule,
    DialogModule,
    RouterModule,
    TranslateModule
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {
  userProfile: any = null;
  user: any = null;
  sessions: SecuritySession[] = [];
  isEditDialogVisible: boolean = false; 
  isDownloadDialogVisible: boolean = false;
  isDeleteDialogVisible: boolean = false;
  isSecurityLogsDialogVisible: boolean = false;

  get activeSessionsCount(): number {
    return this.sessions.filter(session => session.is_active).length;
  }

  constructor(
    private authService: AuthService,
    private securityService: SecurityService,
    private router: Router,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadSessions();
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
        break;
      default:
        break;
    }
  }
}
