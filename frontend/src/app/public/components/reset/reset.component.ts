import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
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
  selector: 'app-reset',
  standalone: true,
  imports: [
    ButtonModule,
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
  templateUrl: './reset.component.html',
  styleUrl: './reset.component.scss'
})
export class ResetComponent implements OnInit {
  loading = false;
  isDarkMode$;
  userEmail: string = '';
  resetToken: string = '';

  form: FormGroup = new FormGroup({
    password: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/)
    ]),
    confirmPassword: new FormControl(null, [Validators.required])
  });

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
    this.checkParamsFromUrl();
    this.setupPasswordConfirmation();
  }

  private checkParamsFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const token = urlParams.get('token');
    
    if (email) {
      this.userEmail = email;
    }
    
    if (token) {
      this.resetToken = token;
    }
  }

  private setupPasswordConfirmation() {
    this.form.get('confirmPassword')?.valueChanges.subscribe(() => {
      this.validatePasswordConfirmation();
    });
  }

  private validatePasswordConfirmation() {
    const password = this.form.get('password')?.value;
    const confirmPassword = this.form.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      this.form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      this.form.get('confirmPassword')?.setErrors(null);
    }
  }

  get password(): FormControl {
    return this.form.get('password') as FormControl;
  }

  get confirmPassword(): FormControl {
    return this.form.get('confirmPassword') as FormControl;
  }

  resetPassword() {
    if (this.form.invalid) {
      this.notificationService.handleWarning(this.translate.instant('auth.reset.fill-required-fields'));
      return;
    }

    if (this.password.value !== this.confirmPassword.value) {
      this.notificationService.handleWarning(this.translate.instant('auth.reset.passwords-not-match'));
      return;
    }

    if (!this.resetToken) {
      this.notificationService.handleWarning(this.translate.instant('auth.reset.invalid-token'));
      return;
    }

    this.loading = true;
    const data = {
      token: this.resetToken,
      password: this.password.value
    };

    this.authService.resetPassword(data)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.notificationService.handleSuccess(this.translate.instant('auth.reset.success'));
            // Redirect to login page after successful password reset
            setTimeout(() => {
              this.router.navigate(['/login'], { 
                queryParams: { email: this.userEmail } 
              });
            }, 2000);
          } else {
            this.notificationService.handleWarning(response.message || this.translate.instant('auth.reset.reset-failed'));
          }
        },
        error: (error: any) => {
          this.notificationService.handleError(error, this.translate.instant('auth.reset.reset-error'));
        }
      });
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }
}
