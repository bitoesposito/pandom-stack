import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { finalize } from 'rxjs';
import { VerifyRequest } from '../../../models/auth.models';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { ThemeService } from '../../../services/theme.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-verify',
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
    ConfirmDialogModule,
    DividerModule,
    TranslateModule
  ],
  providers: [
    MessageService,
    NotificationService,
    ConfirmationService
  ],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.scss'
})
export class VerifyComponent implements OnInit {
  loading = false
  token: string | null = null
  progressValue: number = 100;
  private progressInterval: any;
  isDarkMode$;

  form: FormGroup = new FormGroup({
    password: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/)
    ]),
    confirmPassword: new FormControl(null, [Validators.required])
  }, { validators: this.passwordMatchValidator });

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private themeService: ThemeService,
    private translate: TranslateService
  ) {
    this.isDarkMode$ = this.themeService.isDarkMode$;
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.notificationService.handleError(this.translate.instant('auth.verify.token-error'), 'Token Error');
      this.router.navigate(['/login']);
    }
  }

  get password(): FormControl {
    return this.form.get('password') as FormControl;
  }

  get confirmPassword(): FormControl {
    return this.form.get('confirmPassword') as FormControl;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  hasLowerCase(password: string): boolean {
    return /[a-z]/.test(password || '');
  }

  hasUpperCase(password: string): boolean {
    return /[A-Z]/.test(password || '');
  }

  hasNumber(password: string): boolean {
    return /\d/.test(password || '');
  }

  hasMinLength(password: string): boolean {
    return (password || '').length >= 8;
  }

  hasSymbol(password: string): boolean {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password || '');
  }

  resetPassword() {
    if (this.form.invalid || !this.token) {
      this.notificationService.handleWarning(this.translate.instant('auth.login.fill-required-fields'));
      return;
    }

    this.loading = true;
    const data: VerifyRequest = {
      token: this.token,
      password: this.password.value
    };

    this.authService.verifyToken(data)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          localStorage.removeItem('access_token');
          localStorage.setItem('show_password_reset_notification', 'true');
          this.notificationService.handleSuccess(this.translate.instant('auth.verify.success'));
          this.router.navigate(['/login']);
        },
        error: (error: any) => {
          this.notificationService.handleError(error, this.translate.instant('auth.verify.error'));
        }
      });
  }

  confirmPasswordDialog(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.translate.instant('auth.verify.confirm-dialog.message'),
      header: this.translate.instant('auth.verify.confirm-dialog.header'),
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-circle',
      rejectButtonProps: {
        label: this.translate.instant('auth.verify.confirm-dialog.cancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.translate.instant('auth.verify.confirm-dialog.confirm'),
      },
      accept: () => {
        this.resetPassword();
      },
      reject: () => {
      },
    });
  }

  ngOnDestroy() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }
}
