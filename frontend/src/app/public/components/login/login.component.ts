import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { finalize } from 'rxjs';
import { ThemeService } from '../../../services/theme.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ButtonModule, 
    CheckboxModule, 
    InputTextModule, 
    PasswordModule, 
    FormsModule, 
    RouterModule, 
    RippleModule,
    CommonModule,
    ToastModule,
    ReactiveFormsModule,
    TranslateModule,
    TooltipModule
  ],
  providers: [
    MessageService,
    NotificationService
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loading = false;
  socialLoading = false;
  isDarkMode$;
  focusPassword = false;

  form: FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)]),
    password: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/)
    ]),
    rememberMe: new FormControl(false, [])
  });

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService,
    private translate: TranslateService,
  ) {
    this.isDarkMode$ = this.themeService.isDarkMode$;
  }

  ngOnInit() {
    this.checkEmailFromUrl();
    setTimeout(() => {
      this.checkNotifications();
    }, 100);
  }

  private checkEmailFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    
    if (email) {
      this.form.patchValue({ email });
      this.focusPassword = true;
    } else {
      this.focusPassword = false;
    }
  }

  private checkNotifications() {
    const showNotification = localStorage.getItem('show_password_reset_notification');
    if (showNotification === 'true') {
      this.notificationService.handleSuccess(this.translate.instant('auth.login.password-reset-success'));
      localStorage.removeItem('show_password_reset_notification');
    }
  }

  get email(): FormControl {
    return this.form.get('email') as FormControl;
  }

  get password(): FormControl {
    return this.form.get('password') as FormControl;
  }

  get rememberMe(): FormControl {
    return this.form.get('rememberMe') as FormControl;
  }

  login() {
    if (this.form.invalid) {
      this.notificationService.handleWarning(this.translate.instant('auth.login.fill-required-fields'));
      return;
    }

    this.loading = true;
    // Disabilita tutti i controlli durante il loading
    this.form.disable();
    
    const credentials = {
      email: this.email.value,
      password: this.password.value,
      rememberMe: this.rememberMe.value
    };

    this.authService.login(credentials)
      .pipe(
        finalize(() => {
          this.loading = false;
          // Riabilita tutti i controlli dopo il loading
          this.form.enable();
        })
      )
      .subscribe({
        next: (response) => {
          this.notificationService.handleApiResponse(response, this.translate.instant('auth.login.login-failed'));
          
          if (response.success && response.data) {
            // Store token based on remember me setting
            this.authService.setToken(response.data.access_token);
            
            // Store refresh token
            if (response.data.refresh_token) {
              this.authService.setRefreshToken(response.data.refresh_token);
            }
            
            // Store remember me preference
            if (this.rememberMe.value) {
              localStorage.setItem('remember_me', 'true');
            } else {
              localStorage.removeItem('remember_me');
            }
            
            // Redirect based on user role
            if (response.data.user.role === 'admin') {
              this.router.navigate(['/']);
            } else {
              this.router.navigate(['/']);
            }
          }
        },
        error: (error) => {
          this.notificationService.handleError(error, this.translate.instant('auth.login.login-error'));
        }
      });
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  toggleRememberMe() {
    const currentValue = this.rememberMe.value;
    this.rememberMe.setValue(!currentValue);
  }

  loginWithGoogle(event?: Event) {
    this.socialLoading = false;
    this.notificationService.handleInfo(this.translate.instant('auth.login.google-login-coming-soon'));
  }
  
  loginWithApple(event?: Event) {
    this.socialLoading = false;
    this.notificationService.handleInfo(this.translate.instant('auth.login.apple-login-coming-soon'));
  }
}