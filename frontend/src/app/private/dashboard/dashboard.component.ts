import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { NotificationService } from '../../services/notification.service';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ThemeService } from '../../services/theme.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { PwaService } from '../../services/pwa.service';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { PopoverModule } from 'primeng/popover';

@Component({
  selector: 'app-dashboard',
  imports: [
    ButtonModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    CommonModule,
    FormsModule,
    PaginatorModule,
    RouterModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    DialogModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    AvatarModule,
    AvatarGroupModule,
    PopoverModule
  ],
  providers: [
    ConfirmationService
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  isDarkMode$;
  updateAvailable$;
  isOnline$;

  form: FormGroup = new FormGroup({
    email: new FormControl({ value: '', disabled: false }, [Validators.required, Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)])
  });

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private themeService: ThemeService,
    private translate: TranslateService,
    private authService: AuthService,
    private pwaService: PwaService
  ) {
    this.isDarkMode$ = this.themeService.isDarkMode$;
    this.updateAvailable$ = this.pwaService.updateAvailable;
    this.isOnline$ = this.pwaService.isOnline;
    this.initializePWA();
  }

  private initializePWA(): void {
    // Subscribe to update availability
    this.updateAvailable$.subscribe(available => {
      if (available) {
        this.notificationService.handleInfo(
          this.translate.instant('pwa.update-available')
        );
      }
    });

    // Subscribe to online/offline status
    this.isOnline$.subscribe(isOnline => {
      if (!isOnline) {
        this.notificationService.handleWarning(
          this.translate.instant('pwa.offline-mode')
        );
      }
    });
  }

  async updateApp(): Promise<void> {
    try {
      await this.pwaService.activateUpdate();
    } catch (error) {
      this.notificationService.handleError(error, this.translate.instant('pwa.update-error'));
    }
  }

  disconnect() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }
}
