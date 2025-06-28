import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { finalize } from 'rxjs';
import { ThemeService } from '../../../services/theme.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InputOtp } from 'primeng/inputotp';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [
    ButtonModule,
    RouterModule,
    CommonModule,
    ToastModule,
    ReactiveFormsModule,
    TranslateModule,
    InputOtp
  ],
  providers: [
    ConfirmationService,
    MessageService,
    NotificationService
  ],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.scss'
})
export class VerifyComponent implements OnInit, OnDestroy {
  loading = false; 
  verifying = false;
  verificationAttempted = false;
  isDarkMode$;
  resendTimer = 0;
  resendDisabled = false;
  private timerInterval: any;
  userEmail: string = '';

  form: FormGroup = new FormGroup({
    token: new FormControl(null, [Validators.required])
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
    this.checkEmailFromUrl();
    this.initializeResendTimer();
    this.setupAutoSubmit();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    localStorage.removeItem('last_resend_time');
  }

  private checkEmailFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    
    if (email) {
      this.userEmail = email;
    }
  }

  private initializeResendTimer() {
    const lastResendTime = localStorage.getItem('last_resend_time');
    const currentTime = Date.now();
    
    if (lastResendTime) {
      const timeElapsed = Math.floor((currentTime - parseInt(lastResendTime)) / 1000);
      const remainingTime = Math.max(0, 60 - timeElapsed);
      
      if (remainingTime > 0) {
        this.resendTimer = remainingTime;
        this.resendDisabled = true;
        this.startTimer();
      } else {
        this.resendTimer = 0;
        this.resendDisabled = false;
        localStorage.removeItem('last_resend_time');
      }
    } else {
      // If no previous resend time, start the timer immediately since email was sent during registration
      this.resendTimer = 60;
      this.resendDisabled = true;
      localStorage.setItem('last_resend_time', Date.now().toString());
      this.startTimer();
    }
  }

  private startTimer() {
    this.timerInterval = setInterval(() => {
      this.resendTimer--;
      
      if (this.resendTimer <= 0) {
        this.resendTimer = 0;
        this.resendDisabled = false;
        localStorage.removeItem('last_resend_time');
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  resendCode() {
    if (this.resendDisabled || !this.userEmail) return;

    this.resendDisabled = true;
    this.resendTimer = 60;
    localStorage.setItem('last_resend_time', Date.now().toString());
    
    this.startTimer();
    
    this.authService.resendVerification({ email: this.userEmail })
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.notificationService.handleSuccess(this.translate.instant('auth.verify.resend-code-sent'));
          } else {
            this.notificationService.handleWarning(response.message || this.translate.instant('auth.verify.resend-code-failed'));
          }
        },
        error: (error: any) => {
          this.notificationService.handleError(error, this.translate.instant('auth.verify.resend-code-error'));
        }
      });
  }

  getResendButtonLabel(): string {
    if (this.resendDisabled && this.resendTimer > 0) {
      return `${this.translate.instant('auth.verify.resend-code')} (${this.resendTimer}s)`;
    }
    return this.translate.instant('auth.verify.resend-code');
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

  verify() {
    if (this.form.invalid || this.verifying) {
      this.notificationService.handleWarning(this.translate.instant('auth.verify.fill-required-fields'));
      return;
    }

    // Controllo aggiuntivo per evitare chiamate multiple
    if (this.verifying) {
      return;
    }

    this.verifying = true;
    this.verificationAttempted = true;
    // Disabilita tutti i controlli durante la verifica
    this.form.disable();

    const data = {
      token: this.token.value
    };

    // Add minimum delay of 1 second for better UX
    const startTime = Date.now();
    const minDelay = 1000; // 1 second

    this.authService.verifyEmail(data)
      .pipe(
        finalize(() => {
          // Non riabilitare il form qui, lo facciamo solo in caso di errore
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.notificationService.handleSuccess(this.translate.instant('auth.verify.success'));
            localStorage.removeItem('last_resend_time');
            // Blocca il form e impedisci altre verifiche
            this.form.disable();
            this.verifying = true;
            this.verificationAttempted = true;
            // Redirect dopo il toast
            setTimeout(() => {
              this.router.navigate(['/login'], { 
                queryParams: { email: this.userEmail } 
              });
            }, 2000);
          } else {
            this.notificationService.handleWarning(response.message || this.translate.instant('auth.verify.verification-failed'));
            // Riabilita il form solo in caso di errore
            this.form.enable();
            this.verifying = false;
            this.verificationAttempted = false;
          }
        },
        error: (error: any) => {
          this.notificationService.handleError(error, this.translate.instant('auth.verify.verification-error'));
          // Riabilita il form solo in caso di errore
          this.form.enable();
          this.verifying = false;
          this.verificationAttempted = false;
        }
      });
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;
    
    const pastedText = clipboardData.getData('text');
    if (!pastedText) return;
    
    // Estrai solo i numeri dal testo incollato
    const numbers = pastedText.replace(/\D/g, '').slice(0, 6);
    
    if (numbers.length === 6) {
      // Temporaneamente disabilita l'auto-submit
      this.verificationAttempted = true;
      
      this.form.patchValue({ token: numbers });
      
      // Riabilita l'auto-submit dopo un breve delay
      setTimeout(() => {
        this.verificationAttempted = false;
        // Se il form è valido, procedi con la verifica
        if (this.form.valid && !this.verifying) {
          this.verify();
        }
      }, 200);
    }
  }

  private setupAutoSubmit() {
    this.form.get('token')?.valueChanges.subscribe((value: string) => {
      if (value && value.length === 6 && !this.verifying && !this.verificationAttempted) {
        // Auto-submit when OTP is complete and no verification was attempted yet
        setTimeout(() => {
          if (this.form.valid && !this.verifying) {
            this.verify();
          }
        }, 100); // Small delay to ensure the value is properly set
      }
    });
  }
}
