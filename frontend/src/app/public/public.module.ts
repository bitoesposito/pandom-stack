import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './components/login/login.component';
import { RecoverComponent } from './components/recover/recover.component';
import { VerifyComponent } from './components/verify/verify.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PublicRoutingModule } from './public-routing.module';
import { MessageService } from 'primeng/api';
import { NotificationService } from '../services/notification.service';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    PublicRoutingModule,
    LoginComponent,
    RecoverComponent,
    VerifyComponent,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    TranslateModule
  ],
  providers: [
    MessageService,
    NotificationService
  ]
})
export class PublicModule { } 