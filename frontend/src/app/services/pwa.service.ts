import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map } from 'rxjs/operators';
import { BehaviorSubject, Subscription } from 'rxjs';
import { OfflineStorageService } from './offline-storage.service';
import { SyncQueueService } from './sync-queue.service';
import { NotificationService } from './notification.service';

/**
 * Type definition for the beforeinstallprompt event
 * 
 * Defines the structure of the beforeinstallprompt event
 * that is fired when the PWA can be installed.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

/**
 * Extended WindowEventMap to include beforeinstallprompt event
 * 
 * Adds the beforeinstallprompt event to the window event map
 * for proper TypeScript typing.
 */
interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}

/**
 * Progressive Web App (PWA) Service
 * 
 * Manages Progressive Web App functionality including service worker updates,
 * installation prompts, offline capabilities, and online/offline state monitoring.
 * This service provides comprehensive PWA features for enhanced user experience.
 * 
 * Features:
 * - Service worker update management
 * - PWA installation prompts
 * - Online/offline state monitoring
 * - Automatic update checks
 * - Offline service initialization
 * - Installation status detection
 * - Synchronization management
 * 
 * PWA Capabilities:
 * - Automatic update detection and activation
 * - Installation prompt handling
 * - Offline functionality support
 * - Background sync capabilities
 * - App-like experience
 * - Push notification support
 * 
 * Update Management:
 * - Automatic update checks every hour
 * - Manual update activation
 * - Version ready notifications
 * - Seamless update process
 * 
 * Installation Features:
 * - Installation prompt management
 * - Installation status detection
 * - Platform-specific installation
 * - Installation outcome tracking
 * 
 * Offline Support:
 * - Offline state detection
 * - Offline service initialization
 * - Data synchronization
 * - Offline capability detection
 * 
 * Usage:
 * - Inject service in components
 * - Subscribe to observables for state changes
 * - Call methods for PWA operations
 * - Handle installation and updates
 * 
 * @example
 * // Subscribe to update availability
 * this.pwaService.updateAvailable.subscribe(available => {
 *   if (available) {
 *     // Show update notification
 *   }
 * });
 * 
 * @example
 * // Check online status
 * this.pwaService.isOnline.subscribe(online => {
 *   if (online) {
 *     // Enable online features
 *   } else {
 *     // Enable offline mode
 *   }
 * });
 * 
 * @example
 * // Prompt for installation
 * this.pwaService.promptInstall();
 */
@Injectable({
  providedIn: 'root'
})
export class PwaService {
  // ============================================================================
  // PROPERTIES
  // ============================================================================

  /**
   * BehaviorSubject for update availability state
   * Emits true when a new version is available
   */
  private updateAvailable$ = new BehaviorSubject<boolean>(false);

  /**
   * BehaviorSubject for online/offline state
   * Emits current connection status
   */
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);

  /**
   * BehaviorSubject for PWA installation capability
   * Emits true when PWA can be installed
   */
  private canInstall$ = new BehaviorSubject<boolean>(false);

  /**
   * Deferred installation prompt
   * Stores the beforeinstallprompt event for later use
   */
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  /**
   * Subscription management
   * Manages all service worker and event subscriptions
   */
  private subscriptions: Subscription = new Subscription();

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  constructor(
    private swUpdate: SwUpdate,
    private offlineStorage: OfflineStorageService,
    private syncQueue: SyncQueueService,
    private notification: NotificationService
  ) {
    this.initializePWA();
    this.setupInstallationEvents();
  }

  // ============================================================================
  // INITIALIZATION METHODS
  // ============================================================================

  /**
   * Initialize PWA functionality
   * 
   * Sets up service worker update checks, online/offline monitoring,
   * and automatic update detection. This method is called during
   * service construction to establish PWA capabilities.
   * 
   * Initialization process:
   * 1. Set up service worker update monitoring
   * 2. Configure automatic update checks
   * 3. Monitor online/offline status
   * 4. Handle offline synchronization
   */
  private initializePWA(): void {
    // Check for updates if service worker is enabled
    if (this.swUpdate.isEnabled) {
      // Monitor version updates
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

      // Check for updates every hour (3600000 ms)
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 60 * 60 * 1000);
    }

    // Monitor online/offline status changes
    window.addEventListener('online', () => {
      this.isOnline$.next(true);
      this.notification.handleInfo('Sei tornato online');
      
      // Process sync queue when back online
      this.syncQueue.processQueue().then(() => {
        this.notification.handleSuccess('Sincronizzazione completata');
      }).catch(() => {
        this.notification.handleWarning('Errore durante la sincronizzazione');
      });
    });

    window.addEventListener('offline', () => {
      this.isOnline$.next(false);
      this.notification.handleWarning('Sei offline. Le modifiche verranno salvate localmente.');
      
      // Store offline start time
      localStorage.setItem('offline-start', Date.now().toString());
    });
  }

  /**
   * Set up PWA installation event handlers
   * 
   * Configures event listeners for PWA installation prompts
   * and installation completion events.
   */
  private setupInstallationEvents(): void {
    // Handle beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      const beforeInstallPromptEvent = event as BeforeInstallPromptEvent;
      beforeInstallPromptEvent.preventDefault();
      this.deferredPrompt = beforeInstallPromptEvent;
      this.canInstall$.next(true);
    });

    // Handle appinstalled event
    window.addEventListener('appinstalled', () => {
      this.canInstall$.next(false);
      this.deferredPrompt = null;
      this.notification.handleSuccess('PWA installata con successo!');
    });
  }

  // ============================================================================
  // OBSERVABLE GETTERS
  // ============================================================================

  /**
   * Get observable for update availability
   * 
   * Returns an observable that emits true when a new version
   * of the application is available for activation.
   * 
   * @returns Observable<boolean> - True when update is available
   * 
   * @example
   * this.pwaService.updateAvailable.subscribe(available => {
   *   if (available) {
   *     // Show update notification to user
   *     this.showUpdateNotification();
   *   }
   * });
   */
  get updateAvailable() {
    return this.updateAvailable$.asObservable();
  }

  /**
   * Get observable for online/offline status
   * 
   * Returns an observable that emits the current connection status.
   * 
   * @returns Observable<boolean> - True when online, false when offline
   * 
   * @example
   * this.pwaService.isOnline.subscribe(online => {
   *   if (online) {
   *     this.enableOnlineFeatures();
   *   } else {
   *     this.enableOfflineMode();
   *   }
   * });
   */
  get isOnline() {
    return this.isOnline$.asObservable();
  }

  /**
   * Get observable for PWA installation capability
   * 
   * Returns an observable that emits true when the PWA
   * can be installed on the current device.
   * 
   * @returns Observable<boolean> - True when PWA can be installed
   * 
   * @example
   * this.pwaService.canInstall.subscribe(canInstall => {
   *   if (canInstall) {
   *     this.showInstallButton();
   *   } else {
   *     this.hideInstallButton();
   *   }
   * });
   */
  get canInstall() {
    return this.canInstall$.asObservable();
  }

  // ============================================================================
  // UPDATE MANAGEMENT METHODS
  // ============================================================================

  /**
   * Activate available update and reload application
   * 
   * Activates the new version of the application and reloads
   * the page to apply the update. This method should be called
   * when the user confirms they want to apply an update.
   * 
   * @returns Promise<void>
   * 
   * @example
   * this.pwaService.activateUpdate().then(() => {
   *   console.log('Update activated and page reloaded');
   * });
   * 
   * Update process:
   * 1. Activates the new version in service worker
   * 2. Reloads the page to apply changes
   * 3. Ensures seamless update experience
   */
  async activateUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      await this.swUpdate.activateUpdate();
      window.location.reload();
    }
  }

  /**
   * Check for service worker updates
   * 
   * Manually triggers a check for updates to the service worker.
   * This method can be called to check for updates outside of
   * the automatic hourly check.
   * 
   * @returns Promise<void>
   * 
   * @example
   * this.pwaService.checkForUpdate().then(() => {
   *   console.log('Update check completed');
   * });
   */
  async checkForUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      await this.swUpdate.checkForUpdate();
    }
  }

  // ============================================================================
  // INSTALLATION METHODS
  // ============================================================================

  /**
   * Check if PWA is installed
   * 
   * Determines if the application is currently running as an
   * installed PWA rather than in a browser tab.
   * 
   * @returns boolean - True if PWA is installed
   * 
   * @example
   * if (this.pwaService.isPWAInstalled()) {
   *   console.log('Running as installed PWA');
   * } else {
   *   console.log('Running in browser');
   * }
   * 
   * Detection methods:
   * - display-mode: standalone (modern browsers)
   * - navigator.standalone (iOS Safari)
   */
  isPWAInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Check if PWA can be installed
   * 
   * Determines if the current environment supports PWA installation
   * by checking for required browser capabilities.
   * 
   * @returns boolean - True if PWA can be installed
   * 
   * @example
   * if (this.pwaService.canInstallPWA()) {
   *   console.log('PWA installation supported');
   * } else {
   *   console.log('PWA installation not supported');
   * }
   * 
   * Requirements:
   * - Service Worker support
   * - Push Manager support
   */
  canInstallPWA(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Prompt user to install PWA
   * 
   * Shows the native installation prompt to the user and handles
   * the installation outcome. This method should be called when
   * the user clicks an install button.
   * 
   * @returns Promise<void>
   * 
   * @example
   * this.pwaService.promptInstall().then(() => {
   *   console.log('Installation prompt completed');
   * });
   * 
   * Installation process:
   * 1. Shows native installation prompt
   * 2. Waits for user choice (accept/dismiss)
   * 3. Handles installation outcome
   * 4. Updates installation state
   * 5. Shows appropriate notification
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

  // ============================================================================
  // OFFLINE SERVICE METHODS
  // ============================================================================

  /**
   * Initialize offline services
   * 
   * Sets up the offline storage database and prepares
   * the application for offline functionality.
   * 
   * @returns Promise<void>
   * 
   * @example
   * this.pwaService.initializeOfflineServices().then(() => {
   *   console.log('Offline services initialized');
   * }).catch(error => {
   *   console.error('Failed to initialize offline services:', error);
   * });
   * 
   * Initialization process:
   * 1. Sets up IndexedDB database
   * 2. Prepares offline storage
   * 3. Handles initialization errors
   * 4. Shows appropriate notifications
   */
  async initializeOfflineServices(): Promise<void> {
    try {
      await this.offlineStorage.initializeDB();
    } catch (error) {
      this.notification.handleError(error, 'Errore inizializzazione servizi offline');
    }
  }

  /**
   * Get current offline status and capabilities
   * 
   * Returns the current online/offline status and whether
   * the application can work offline.
   * 
   * @returns Object with isOnline and canWorkOffline properties
   * 
   * @example
   * const status = this.pwaService.getOfflineStatus();
   * console.log('Online:', status.isOnline);
   * console.log('Can work offline:', status.canWorkOffline);
   * 
   * Status information:
   * - isOnline: Current connection status
   * - canWorkOffline: Whether offline functionality is available
   */
  getOfflineStatus(): { isOnline: boolean; canWorkOffline: boolean } {
    return {
      isOnline: navigator.onLine,
      canWorkOffline: 'serviceWorker' in navigator && 'indexedDB' in window
    };
  }
} 