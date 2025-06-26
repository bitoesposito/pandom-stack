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
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { finalize } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
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
    TranslateModule
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
  isDarkMode$;

  form: FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)]),
    password: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/)
    ])
  })

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService,
    private translate: TranslateService
  ) {
    this.isDarkMode$ = this.themeService.isDarkMode$;
  }

  ngOnInit() {
    this.checkTokenAndRedirect();
    setTimeout(() => {
      this.checkNotifications();
    }, 100);
  }

  private checkTokenAndRedirect() {
    const token = localStorage.getItem('access_token');

    if (token) {
      try {
        const decoded: any = jwtDecode(token);

        if (decoded.exp && Date.now() < decoded.exp * 1000) {
          if (decoded.role === 'admin') {
            this.router.navigate(['/private/dashboard']);
          } else {
            this.router.navigate(['/private/edit', decoded.sub]);
          }
        } else {
          localStorage.removeItem('access_token');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('access_token');
      }
    }
  }

  private checkNotifications() {
    const showNotification = localStorage.getItem('show_password_reset_notification');
    const showRecoveryNotification = localStorage.getItem('show_password_recovery_notification');
    if (showNotification === 'true') {
      this.notificationService.handleSuccess(this.translate.instant('auth.login.password-reset-success'));
      localStorage.removeItem('show_password_reset_notification');
    }
    if (showRecoveryNotification === 'true') {
      this.notificationService.handleSuccess(this.translate.instant('auth.login.password-recovery-sent'));
      localStorage.removeItem('show_password_recovery_notification');
    }
  }

  get email(): FormControl {
    return this.form.get('email') as FormControl
  }

  get password(): FormControl {
    return this.form.get('password') as FormControl
  }

  login() {
    if (this.form.invalid) {
      this.notificationService.handleWarning(this.translate.instant('auth.login.fill-required-fields'));
      return;
    }

    this.loading = true;
    const credentials = {
      email: this.email.value,
      password: this.password.value
    };

    this.authService.login(credentials)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          this.notificationService.handleApiResponse(response, this.translate.instant('auth.login.login-failed'));
          
          if (response.success && response.data) {
            this.authService.setToken(response.data.access_token);
            // Redirect based on user role
            if (response.data.user.role === 'admin') {
              this.router.navigate(['/private/dashboard']);
            } else {
              this.router.navigate(['/private/edit', response.data.user.uuid]);
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
}