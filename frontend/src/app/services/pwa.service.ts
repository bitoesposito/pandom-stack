import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private updateAvailable$ = new BehaviorSubject<boolean>(false);
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);

  constructor(private swUpdate: SwUpdate) {
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
    });

    window.addEventListener('offline', () => {
      this.isOnline$.next(false);
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
} 