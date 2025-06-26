import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { finalize } from 'rxjs';
import { ThemeService } from '../../../services/theme.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-recover',
  standalone: true,
  imports: [
    ButtonModule,
    InputTextModule,
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
  templateUrl: './recover.component.html',
  styleUrl: './recover.component.scss'
})
export class RecoverComponent {
  loading = false;
  isDarkMode$;

  form: FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)])
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

  get email(): FormControl {
    return this.form.get('email') as FormControl;
  }

  recover() {
    if (this.form.invalid) {
      this.notificationService.handleWarning('Please enter a valid email address');
      return;
    }

    this.loading = true;
    const email = this.email.value;

    this.authService.recoverPassword(email)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: () => {
          localStorage.setItem('show_password_recovery_notification', 'true');
          this.router.navigate(['/login']);
        },
        error: (error: any) => {
          this.notificationService.handleError(error, 'An error occurred during password recovery');
        }
      });
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }
}
