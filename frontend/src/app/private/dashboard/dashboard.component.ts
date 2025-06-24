import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { jwtDecode } from 'jwt-decode';
import { NotificationService } from '../../services/notification.service';
import { ToastModule } from 'primeng/toast';
import { UserService } from '../../services/user.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { finalize } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    TranslateModule
  ],
  providers: [
    MessageService,
    NotificationService,
    ConfirmationService
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  users: any[] = [];
  filteredUsers: any[] = [];
  paginator: any[] = [];
  currentUserEmail: string = ''
  currentUserUuid: string = ''
  showNewUserDialog: boolean = false
  searchTerm: string = '';
  isDarkMode$;

  loading = false;

  form: FormGroup = new FormGroup({
    email: new FormControl({ value: '', disabled: false }, [Validators.required, Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)])
  });

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private userService: UserService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private themeService: ThemeService,
    private translate: TranslateService
  ) {
    this.isDarkMode$ = this.themeService.isDarkMode$;
    this.getUsers();
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.filterUsers();
  }

  private filterUsers() {
    if (!this.searchTerm) {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(user => 
        user.email.toLowerCase().includes(this.searchTerm)
      );
    }
  }

  confirmCreationDialog(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.translate.instant('dashboard.confirm-dialog.create.message'),
      header: this.translate.instant('dashboard.confirm-dialog.create.header'),
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-circle',
      rejectButtonProps: {
        label: this.translate.instant('dashboard.confirm-dialog.create.cancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.translate.instant('dashboard.confirm-dialog.create.confirm'),
      },
      accept: () => {
        this.create();
      },
      reject: () => {
        this.form.reset();
        this.showNewUserDialog = false;
      },
    });
  }

  create() {
    if (this.form.invalid) {
      this.notificationService.handleWarning(this.translate.instant('dashboard.errors.fill-required-fields'));
      return;
    }

    this.loading = true;
    this.userService.createUser(this.form.get('email')?.value)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.showNewUserDialog = false; // Close modal after operation
          this.form.reset(); // Reset form
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.handleSuccess(this.translate.instant('dashboard.success.user-created'));
            this.getUsers(); // Refresh user list
          } else {
            this.notificationService.handleError(response.message, this.translate.instant('dashboard.errors.user-creation-failed'));
          }
        },
        error: (error) => {
          this.notificationService.handleError(error, this.translate.instant('dashboard.errors.user-creation-error'));
        }
      });
  }

  deleteUserDialog(event: Event, email: string) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.translate.instant('dashboard.confirm-dialog.delete.message'),
      header: this.translate.instant('dashboard.confirm-dialog.delete.header'),
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-circle',
      rejectButtonProps: {
        label: this.translate.instant('dashboard.confirm-dialog.delete.cancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.translate.instant('dashboard.confirm-dialog.delete.delete'),
        severity: 'danger'
      },
      accept: () => {
        this.loading = true;
        this.deleteUser(email);
      },
      reject: () => {
        // No action needed on reject
      },
    });
  }

  setCurrentUserEmail() {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decoded: any = jwtDecode(token);
      this.currentUserEmail = decoded.email;
      // Trova l'UUID dell'utente corrente dalla lista degli utenti
      const currentUser = this.users.find(user => user.email === decoded.email);
      if (currentUser) {
        this.currentUserUuid = currentUser.uuid;
      }
    }
  }

  onEditProfileClick() {
    if (this.currentUserUuid) {
      this.router.navigateByUrl(`/private/edit/${this.currentUserUuid}`);
    } else {
      this.notificationService.handleError(null, this.translate.instant('dashboard.errors.user-profile-not-found'));
    }
  }

  getUsers() {
    this.userService.getUsers().subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data || [];
          this.filteredUsers = this.users;
          // Aggiorna l'UUID dell'utente corrente dopo aver ottenuto la lista
          this.setCurrentUserEmail();
        } else {
          this.notificationService.showMessage('error', response.message || this.translate.instant('dashboard.errors.error-retrieving-users'));
        }
      },
      error: (error) => {
        this.notificationService.handleError(error, this.translate.instant('dashboard.errors.error-retrieving-users'));
      }
    });
  }

  deleteUser(email: string) {
    this.userService.deleteUser(email)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.showMessage('success', this.translate.instant('dashboard.success.user-deleted'));
            this.getUsers(); // Refresh user list
          } else {
            this.notificationService.showMessage('error', response.message || this.translate.instant('dashboard.errors.error-deleting-user'));
          }
        },
        error: (error) => {
          this.notificationService.handleError(error, this.translate.instant('dashboard.errors.error-deleting-user'));
        }
      });
  }

  disconnect() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }

  toggleNewUserDialog() {
    this.showNewUserDialog = !this.showNewUserDialog
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }
}
