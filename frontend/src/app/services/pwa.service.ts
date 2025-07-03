import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { OfflineStorageService } from './offline-storage.service';
import { SyncQueueService } from './sync-queue.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private updateAvailable$ = new BehaviorSubject<boolean>(false);
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);

  constructor(
    private swUpdate: SwUpdate,
    private offlineStorage: OfflineStorageService,
    private syncQueue: SyncQueueService,
    private notification: NotificationService
  ) {
    this.initializePWA();
  }

  private initializePWA(): void {
    // Check for updates
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
          map(() => true)
        )
        .subscribe(() => {
          this.updateAvailable$.next(true);
        });

      // Check for updates every hour
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 60 * 60 * 1000);
    }

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline$.next(true);
      this.notification.handleInfo('Sei tornato online');
      this.syncQueue.processQueue().then(() => {
        this.notification.handleSuccess('Sincronizzazione completata');
      }).catch(() => {
        this.notification.handleWarning('Errore durante la sincronizzazione');
      });
    });

    window.addEventListener('offline', () => {
      this.isOnline$.next(false);
      this.notification.handleWarning('Sei offline. Le modifiche verranno salvate localmente.');
      localStorage.setItem('offline-start', Date.now().toString());
    });
  }

  get updateAvailable() {
    return this.updateAvailable$.asObservable();
  }

  get isOnline() {
    return this.isOnline$.asObservable();
  }

  async activateUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      await this.swUpdate.activateUpdate();
      window.location.reload();
    }
  }

  async checkForUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      await this.swUpdate.checkForUpdate();
    }
  }

  isPWAInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  canInstallPWA(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async initializeOfflineServices(): Promise<void> {
    try {
      await this.offlineStorage.initializeDB();
    } catch (error) {
      this.notification.handleError(error, 'Errore inizializzazione servizi offline');
    }
  }

  getOfflineStatus(): { isOnline: boolean; canWorkOffline: boolean } {
    return {
      isOnline: navigator.onLine,
      canWorkOffline: 'serviceWorker' in navigator && 'indexedDB' in window
    };
  }
} 