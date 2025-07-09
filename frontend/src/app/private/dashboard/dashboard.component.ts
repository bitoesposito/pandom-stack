import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { ToastModule } from 'primeng/toast';
import { ThemeService } from '../../services/theme.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { PwaService } from '../../services/pwa.service';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { MessageService } from 'primeng/api';
import { CookieAuthService } from '../../services/cookie-auth.service';

/**
 * Dashboard Component
 * 
 * Main dashboard page for authenticated users.
 * Handles PWA updates and online/offline status notifications.
 */
@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    ToastModule,
    TranslateModule,
    NavBarComponent
  ],
  providers: [
    MessageService,
    NotificationService
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  // Observable streams for reactive UI updates
  isDarkMode$;
  updateAvailable$;
  isOnline$;

  constructor(
    private notificationService: NotificationService,
    private themeService: ThemeService,
    private translate: TranslateService,
    private pwaService: PwaService
  ) {
    // Initialize observable streams
    this.isDarkMode$ = this.themeService.isDarkMode$;
    this.updateAvailable$ = this.pwaService.updateAvailable;
    this.isOnline$ = this.pwaService.isOnline;
    
    // Setup PWA functionality
    this.initializePWA();
  }

  /**
   * Initialize PWA-related functionality
   * Sets up listeners for app updates and online/offline status
   */
  private initializePWA(): void {
    // Listen for PWA update availability
    this.updateAvailable$.subscribe((available: boolean) => {
      if (available) {
        this.notificationService.handleInfo(
          this.translate.instant('pwa.update-available')
        );
      }
    });

    // Listen for online/offline status changes
    this.isOnline$.subscribe((isOnline: boolean) => {
      if (!isOnline) {
        this.notificationService.handleWarning(
          this.translate.instant('pwa.offline-mode')
        );
      }
    });
  }
}
