import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImageModule } from 'primeng/image';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ImageModule,
    ToastModule,
    ConfirmDialogModule,
    TranslateModule
  ],
  providers: [
    MessageService,
    ConfirmationService
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend';

  constructor(private translate: TranslateService) {
    // Initialize translations
    translate.setDefaultLang('en-US');
    translate.use('en-US');
  }

  ngOnInit() {
    // Test translation
    this.translate.get('auth.login').subscribe((res: string) => {
      console.log('Translation test:', res);
    });
  }
}
