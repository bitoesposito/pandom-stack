import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputOtpModule } from 'primeng/inputotp';
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
    TooltipModule,
    InputOtpModule
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

  form: FormGroup = new FormGroup({
    otp: new FormControl(null, [Validators.required]),
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
    
    if (email) {
      this.userEmail = email;
    }
  }

  private setupPasswordConfirmation() {
    // Validazione in tempo reale per entrambi i campi password
    this.form.get('password')?.valueChanges.subscribe(() => {
      this.validatePasswordConfirmation();
    });
    
    this.form.get('confirmPassword')?.valueChanges.subscribe(() => {
      this.validatePasswordConfirmation();
    });
  }

  private validatePasswordConfirmation() {
    const password = this.form.get('password')?.value;
    const confirmPassword = this.form.get('confirmPassword')?.value;
    
    if (password && confirmPassword) {
      if (password !== confirmPassword) {
        this.form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      } else {
        this.form.get('confirmPassword')?.setErrors(null);
      }
    } else {
      // Rimuovi errori se uno dei campi è vuoto
      this.form.get('confirmPassword')?.setErrors(null);
    }
  }

  get otp(): FormControl {
    return this.form.get('otp') as FormControl;
  }

  get password(): FormControl {
    return this.form.get('password') as FormControl;
  }

  get confirmPassword(): FormControl {
    return this.form.get('confirmPassword') as FormControl;
  }

  resetPassword() {
    // Validazione OTP
    if (this.otp.invalid) {
      if (this.otp.errors?.['required']) {
        this.notificationService.handleWarning(this.translate.instant('auth.reset.otp-required'));
      }
      return;
    }

    // Validazione password
    if (this.password.invalid) {
      if (this.password.errors?.['required']) {
        this.notificationService.handleWarning(this.translate.instant('auth.reset.password-required'));
      } else if (this.password.errors?.['pattern']) {
        this.notificationService.handleWarning(this.translate.instant('auth.reset.password-pattern'));
      }
      return;
    }

    // Validazione conferma password
    if (this.confirmPassword.invalid) {
      if (this.confirmPassword.errors?.['required']) {
        this.notificationService.handleWarning(this.translate.instant('auth.reset.confirm-password-required'));
      } else if (this.confirmPassword.errors?.['passwordMismatch']) {
        this.notificationService.handleWarning(this.translate.instant('auth.reset.passwords-not-match'));
      }
      return;
    }

    // Controllo finale di sicurezza
    if (this.password.value !== this.confirmPassword.value) {
      this.notificationService.handleWarning(this.translate.instant('auth.reset.passwords-not-match'));
      return;
    }

    this.loading = true;
    // Disabilita tutti i controlli durante il loading
    this.form.disable();
    
    const data = {
      otp: this.otp.value,
      password: this.password.value
    };

    this.authService.resetPassword(data)
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response.success) {
            this.notificationService.handleSuccess(this.translate.instant('auth.reset.success'));
            // Keep form disabled during redirect delay
            // Redirect to login page after successful password reset
            setTimeout(() => {
              this.router.navigate(['/login'], { 
                queryParams: { email: this.userEmail } 
              });
            }, 2000);
          } else {
            // Re-enable form only on error
            this.form.enable();
            this.notificationService.handleWarning(response.message || this.translate.instant('auth.reset.reset-failed'));
          }
        },
        error: (error: any) => {
          this.loading = false;
          // Re-enable form on error
          this.form.enable();
          this.notificationService.handleError(error, this.translate.instant('auth.reset.reset-error'));
        }
      });
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }
}
