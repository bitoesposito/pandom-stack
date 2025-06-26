import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { finalize } from 'rxjs';
import { ThemeService } from '../../../services/theme.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-verify',
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
    ConfirmDialogModule,
    DividerModule,
    TranslateModule
  ],
  providers: [
    ConfirmationService
  ],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.scss'
})
export class VerifyComponent implements OnInit {
  loading = false;
  isDarkMode$;

  form: FormGroup = new FormGroup({
    token: new FormControl(null, [Validators.required]),
    password: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/)
    ]),
    confirmPassword: new FormControl(null, [Validators.required])
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
    this.checkTokenFromUrl();
  }

  private checkTokenFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      this.form.patchValue({ token });
    }
  }

  get token(): FormControl {
    return this.form.get('token') as FormControl
  }

  get password(): FormControl {
    return this.form.get('password') as FormControl
  }

  get confirmPassword(): FormControl {
    return this.form.get('confirmPassword') as FormControl
  }

  hasMinLength(password: string): boolean {
    return (password || '').length >= 8;
  }

  hasUppercase(password: string): boolean {
    return /[A-Z]/.test(password || '');
  }

  hasLowercase(password: string): boolean {
    return /[a-z]/.test(password || '');
  }

  hasNumber(password: string): boolean {
    return /\d/.test(password || '');
  }

  hasSymbol(password: string): boolean {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password || '');
  }

  verify() {
    if (this.form.invalid) {
      this.notificationService.handleWarning(this.translate.instant('auth.verify.fill-required-fields'));
      return;
    }

    if (this.password.value !== this.confirmPassword.value) {
      this.notificationService.handleWarning(this.translate.instant('auth.verify.passwords-not-match'));
      return;
    }

    this.loading = true;
    const data = {
      token: this.token.value,
      password: this.password.value
    };

    this.authService.verifyToken(data)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          this.notificationService.handleApiResponse(response, this.translate.instant('auth.verify.verification-failed'));
          
          if (response.success) {
            localStorage.setItem('show_password_reset_notification', 'true');
            this.router.navigate(['/login']);
          }
        },
        error: (error) => {
          this.notificationService.handleError(error, this.translate.instant('auth.verify.verification-error'));
        }
      });
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }
}
