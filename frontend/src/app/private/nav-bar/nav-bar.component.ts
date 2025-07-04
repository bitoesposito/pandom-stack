import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { NotificationService } from '../../services/notification.service';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ThemeService } from '../../services/theme.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { PwaService } from '../../services/pwa.service';
import { PopoverModule } from 'primeng/popover';
import { jwtDecode } from 'jwt-decode';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { Language } from '../../models/language.models';

@Component({
  selector: 'app-nav-bar',
  imports: [
    ButtonModule,
    CommonModule,
    RouterModule,
    ToastModule,
    TooltipModule,
    TranslateModule,
    PopoverModule,
    SelectModule,
    FormsModule
  ],
  providers: [
    ConfirmationService
  ],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent implements OnInit {

  isDarkMode$;
  updateAvailable$;
  isOnline$;
  user: any = {};
  
  // Language selector properties
  languages: Language[] = [];
  selectedLanguage: string = 'en';
  currentLanguage$;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private themeService: ThemeService,
    private translate: TranslateService,
    private authService: AuthService,
    private pwaService: PwaService,
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {
    this.isDarkMode$ = this.themeService.isDarkMode$;
    this.updateAvailable$ = this.pwaService.updateAvailable;
    this.isOnline$ = this.pwaService.isOnline;
    this.currentLanguage$ = this.languageService.currentLanguage$;
  }

  ngOnInit() {
    this.loadUserData();
    this.initializeLanguages();
    this.syncSelectedLanguage();
  }

  private loadUserData() {
    const token = this.authService.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.user = {
          email: decoded.email,
          role: decoded.role,
          uuid: decoded.sub
        };
      } catch (error) {
        console.error('Error decoding token:', error);
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    }
  }

  private initializeLanguages() {
    this.languages = this.languageService.getAvailableLanguages();
    this.selectedLanguage = this.languageService.getCurrentLanguage();
  }

  private syncSelectedLanguage() {
    this.currentLanguage$.subscribe(languageCode => {
      this.selectedLanguage = languageCode;
    });
  }

  changeLanguage(event: any) {
    const languageCode = event.value;
    this.languageService.changeLanguage(languageCode);
    this.selectedLanguage = languageCode;
    
    // Force change detection
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
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
