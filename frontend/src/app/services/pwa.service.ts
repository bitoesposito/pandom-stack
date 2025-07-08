import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map } from 'rxjs/operators';
import { BehaviorSubject, Subscription } from 'rxjs';
import { OfflineStorageService } from './offline-storage.service';
import { SyncQueueService } from './sync-queue.service';
import { NotificationService } from './notification.service';

// Define BeforeInstallPromptEvent type for TypeScript
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

// Extend WindowEventMap to include beforeinstallprompt event
interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private updateAvailable$ = new BehaviorSubject<boolean>(false);
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  private canInstall$ = new BehaviorSubject<boolean>(false);
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private swUpdate: SwUpdate,
    private offlineStorage: OfflineStorageService,
    private syncQueue: SyncQueueService,
    private notification: NotificationService
  ) {
    this.initializePWA();
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      const beforeInstallPromptEvent = event as BeforeInstallPromptEvent;
      beforeInstallPromptEvent.preventDefault();
      this.deferredPrompt = beforeInstallPromptEvent;
      this.canInstall$.next(true);
    });
    window.addEventListener('appinstalled', () => {
      this.canInstall$.next(false);
      this.deferredPrompt = null;
      this.notification.handleSuccess('PWA installata con successo!');
    });
  }

  /**
   * Initializes the PWA by setting up update checks and monitoring online/offline status.
   */
  private initializePWA(): void {
    // Check for updates
    if (this.swUpdate.isEnabled) {
      this.subscriptions.add(
      this.swUpdate.versionUpdates
        .pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
          map(() => true)
        )
        .subscribe(() => {
          this.updateAvailable$.next(true);
          })
      );

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

  /**
   * Returns an observable indicating if an update is available.
   */
  get updateAvailable() {
    return this.updateAvailable$.asObservable();
  }

  /**
   * Returns an observable indicating if the application is online.
   */
  get isOnline() {
    return this.isOnline$.asObservable();
  }

  /**
   * Returns an observable indicating if the PWA can be installed.
   */
  get canInstall() {
    return this.canInstall$.asObservable();
  }

  /**
   * Activates the available update and reloads the application.
   */
  async activateUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      await this.swUpdate.activateUpdate();
      window.location.reload();
    }
  }

  /**
   * Checks for updates to the service worker.
   */
  async checkForUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      await this.swUpdate.checkForUpdate();
    }
  }

  /**
   * Checks if the PWA is installed.
   */
  isPWAInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Checks if the PWA can be installed.
   */
  canInstallPWA(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Initializes offline services by setting up the offline storage database.
   */
  async initializeOfflineServices(): Promise<void> {
    try {
      await this.offlineStorage.initializeDB();
    } catch (error) {
      this.notification.handleError(error, 'Errore inizializzazione servizi offline');
    }
  }

  /**
   * Returns the current offline status and capability to work offline.
   */
  getOfflineStatus(): { isOnline: boolean; canWorkOffline: boolean } {
    return {
      isOnline: navigator.onLine,
      canWorkOffline: 'serviceWorker' in navigator && 'indexedDB' in window
    };
  }

  /**
   * Prompts the user to install the PWA.
   */
  async promptInstall(): Promise<void> {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        this.notification.handleSuccess('Installazione avviata!');
      } else {
        this.notification.handleInfo('Installazione annullata.');
      }
      this.deferredPrompt = null;
      this.canInstall$.next(false);
    }
  }
} 