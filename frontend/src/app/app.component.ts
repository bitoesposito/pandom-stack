import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImageModule } from 'primeng/image';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PwaService } from './services/pwa.service';
import { OfflineStorageService } from './services/offline-storage.service';
import { OfflineSecurityService } from './services/offline-security.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ImageModule,
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

  constructor(
    private translate: TranslateService,
    private pwaService: PwaService,
    private offlineStorage: OfflineStorageService,
    private offlineSecurity: OfflineSecurityService
  ) {
    // Initialize translations - removed as it's now handled by LanguageService
    // translate.setDefaultLang('en-US');
    // translate.use('en-US');
  }

  async ngOnInit() {
    // Inizializza servizi offline
    await this.initializeOfflineServices();
  }

  private async initializeOfflineServices(): Promise<void> {
    try {
      // console.log('Initializing offline services in app component...');
      
      // Inizializza database offline
      await this.offlineStorage.initializeDB();
      
      // Inizializza servizi PWA
      await this.pwaService.initializeOfflineServices();
      
      // Verifica accesso offline
      const canAccessOffline = await this.offlineSecurity.validateOfflineAccess();
              // console.log('Offline access available:', canAccessOffline);
      
      if (canAccessOffline) {
        // Log attività di inizializzazione
        await this.offlineSecurity.logOfflineActivity('App initialized with offline capabilities');
      }
      
              // console.log('Offline services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize offline services:', error);
    }
  }
}
