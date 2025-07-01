# 📱 Offline Capabilities - Pandom Stack

## Panoramica

Il sistema Pandom Stack implementa funzionalità offline avanzate per garantire resilienza e continuità operativa anche in assenza di connessione internet. Questa documentazione descrive l'architettura, l'implementazione e l'utilizzo delle capacità offline.

## 🏗️ Architettura Offline

### Componenti Principali

```
┌─────────────────────────────────────────────────────────────┐
│                    PWA (Progressive Web App)                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Service     │  │ Cache API   │  │ IndexedDB   │         │
│  │ Worker      │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Offline     │  │ Sync Queue  │  │ Background  │         │
│  │ Storage     │  │ Service     │  │ Sync        │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Offline     │  │ Offline     │  │ Offline     │         │
│  │ UI          │  │ Security    │  │ Export      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Implementazione

### 1. Service Worker

Il Service Worker gestisce il caching e la gestione offline dell'applicazione.

**Configurazione** (`ngsw-config.json`):
```json
{
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/*.css",
          "/*.js"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api-freshness",
      "urls": ["/api/**"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 100,
        "maxAge": "3d",
        "timeout": "10s"
      }
    }
  ]
}
```

**Attivazione** (`app.config.ts`):
```typescript
provideServiceWorker('ngsw-worker.js', {
  enabled: !isDevMode(),
  registrationStrategy: 'registerWhenStable:30000'
})
```

### 2. PWA Service

Il servizio PWA gestisce gli aggiornamenti e lo stato online/offline.

```typescript
@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  private updateAvailable$ = new BehaviorSubject<boolean>(false);

  constructor(private swUpdate: SwUpdate) {
    this.initializePWA();
  }

  private initializePWA(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline$.next(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline$.next(false);
    });
  }

  get isOnline() {
    return this.isOnline$.asObservable();
  }
}
```

### 3. Offline Storage (IndexedDB)

Gestione dei dati offline tramite IndexedDB.

```typescript
@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'pandom-offline';
  private readonly DB_VERSION = 1;

  async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store per dati utente
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'uuid' });
          userStore.createIndex('email', 'email', { unique: true });
        }

        // Store per operazioni pendenti
        if (!db.objectStoreNames.contains('pendingOperations')) {
          const operationStore = db.createObjectStore('pendingOperations', { keyPath: 'id' });
          operationStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store per log di sicurezza
        if (!db.objectStoreNames.contains('securityLogs')) {
          const logStore = db.createObjectStore('securityLogs', { keyPath: 'id', autoIncrement: true });
          logStore.createIndex('userId', 'userId', { unique: false });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async storeUserData(userData: OfflineUserData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    
    return new Promise((resolve, reject) => {
      const request = store.put(userData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUserData(userId: string): Promise<OfflineUserData | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    
    return new Promise((resolve, reject) => {
      const request = store.get(userId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
}
```

### 4. Sync Queue Service

Gestione della coda di sincronizzazione per operazioni offline.

```typescript
@Injectable({
  providedIn: 'root'
})
export class SyncQueueService {
  private readonly queueKey = 'sync-queue';
  private isSyncing = false;

  async addToQueue(operation: OfflineOperation): Promise<void> {
    const queue = this.getQueue();
    queue.push({
      ...operation,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    });
    this.saveQueue(queue);
  }

  async processQueue(): Promise<void> {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    const queue = this.getQueue();
    
    for (const operation of queue) {
      try {
        await this.processOperation(operation);
        this.removeFromQueue(operation.id);
      } catch (error) {
        console.error('Sync operation failed:', error);
        // Implement retry logic with exponential backoff
      }
    }
    
    this.isSyncing = false;
  }

  private async processOperation(operation: OfflineOperation): Promise<void> {
    const { type, endpoint, data } = operation;
    
    switch (type) {
      case 'CREATE':
        await this.http.post(endpoint, data).toPromise();
        break;
      case 'UPDATE':
        await this.http.put(endpoint, data).toPromise();
        break;
      case 'DELETE':
        await this.http.delete(endpoint).toPromise();
        break;
    }
  }

  private getQueue(): OfflineOperation[] {
    const queue = localStorage.getItem(this.queueKey);
    return queue ? JSON.parse(queue) : [];
  }

  private saveQueue(queue: OfflineOperation[]): void {
    localStorage.setItem(this.queueKey, JSON.stringify(queue));
  }

  private removeFromQueue(operationId: string): void {
    const queue = this.getQueue();
    const filteredQueue = queue.filter(op => op.id !== operationId);
    this.saveQueue(filteredQueue);
  }
}
```

## 🎯 Funzionalità Offline

### 1. Autenticazione Offline

```typescript
@Injectable({
  providedIn: 'root'
})
export class OfflineAuthService {
  async validateOfflineAccess(): Promise<boolean> {
    const token = this.authService.getToken();
    if (!token) return false;

    // Verifica token locale (JWT decode)
    try {
      const decoded = jwt_decode(token);
      const now = Date.now() / 1000;
      
      if (decoded.exp < now) {
        // Token scaduto, prova refresh offline
        return await this.refreshTokenOffline();
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private async refreshTokenOffline(): Promise<boolean> {
    const refreshToken = this.authService.getRefreshToken();
    if (!refreshToken) return false;

    // Implementa refresh token offline
    // (richiede implementazione specifica)
    return false;
  }
}
```

### 2. Gestione Dati Offline

```typescript
@Injectable({
  providedIn: 'root'
})
export class OfflineDataService {
  async syncUserData(userId: string): Promise<void> {
    // Sincronizza dati utente dal server
    const userData = await this.userService.getUser(userId).toPromise();
    
    // Salva in IndexedDB
    await this.offlineStorage.storeUserData({
      user: userData.data.user,
      profile: userData.data.profile,
      security_logs: userData.data.security_logs,
      last_sync: new Date().toISOString()
    });
  }

  async getOfflineUserData(userId: string): Promise<OfflineUserData | null> {
    return await this.offlineStorage.getUserData(userId);
  }

  async updateProfileOffline(profileData: any): Promise<void> {
    // Salva modifica in coda sync
    await this.syncQueue.addToQueue({
      type: 'UPDATE',
      endpoint: '/api/profile',
      data: profileData
    });

    // Aggiorna cache locale
    const currentData = await this.getOfflineUserData(this.authService.getCurrentUserId());
    if (currentData) {
      currentData.profile = { ...currentData.profile, ...profileData };
      await this.offlineStorage.storeUserData(currentData);
    }
  }
}
```

### 3. Export Dati Offline

```typescript
@Injectable({
  providedIn: 'root'
})
export class OfflineExportService {
  async exportUserDataOffline(userId: string): Promise<Blob> {
    const userData = await this.offlineDataService.getOfflineUserData(userId);
    
    if (!userData) {
      throw new Error('No offline data available');
    }

    const exportData = {
      user: userData.user,
      profile: userData.profile,
      security_logs: userData.security_logs,
      export_info: {
        exported_at: new Date().toISOString(),
        exported_by: userId,
        format: 'json',
        source: 'offline'
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  async downloadOfflineData(userId: string): Promise<void> {
    const blob = await this.exportUserDataOffline(userId);
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-data-${userId}-offline.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
```

## 🎨 Componenti UI Offline

### 1. Offline Banner Component

```typescript
@Component({
  selector: 'app-offline-banner',
  template: `
    <div *ngIf="!isOnline" class="offline-banner">
      <i class="pi pi-wifi-off"></i>
      <span>{{ 'offline.banner.message' | translate }}</span>
      <button (click)="retryConnection()" class="retry-btn">
        {{ 'offline.banner.retry' | translate }}
      </button>
    </div>
  `,
  styles: [`
    .offline-banner {
      background: #ff6b6b;
      color: white;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }
    
    .retry-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class OfflineBannerComponent {
  isOnline = true;

  constructor(
    private pwaService: PwaService,
    private syncQueue: SyncQueueService
  ) {
    this.pwaService.isOnline.subscribe(online => {
      this.isOnline = online;
      if (online) {
        this.syncQueue.processQueue();
      }
    });
  }

  retryConnection(): void {
    this.syncQueue.processQueue();
  }
}
```

### 2. Sync Status Component

```typescript
@Component({
  selector: 'app-sync-status',
  template: `
    <div class="sync-status" [class.syncing]="isSyncing">
      <i class="pi" [class.pi-sync]="!isSyncing" [class.pi-spin]="isSyncing"></i>
      <span>{{ syncMessage }}</span>
      <span *ngIf="pendingOperations > 0" class="pending-count">
        ({{ pendingOperations }})
      </span>
    </div>
  `,
  styles: [`
    .sync-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      background: #e3f2fd;
      color: #1976d2;
    }
    
    .sync-status.syncing {
      background: #fff3e0;
      color: #f57c00;
    }
    
    .pending-count {
      background: #ff5722;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }
  `]
})
export class SyncStatusComponent {
  isSyncing = false;
  pendingOperations = 0;
  syncMessage = '';

  constructor(private syncQueue: SyncQueueService) {
    this.updateStatus();
  }

  private updateStatus(): void {
    this.pendingOperations = this.syncQueue.getPendingOperations().length;
    this.syncMessage = this.pendingOperations > 0 
      ? 'Pending sync' 
      : 'All synced';
  }
}
```

## 🔐 Sicurezza Offline

### 1. Validazione Accesso

```typescript
@Injectable({
  providedIn: 'root'
})
export class OfflineSecurityService {
  async validateOfflineAccess(): Promise<boolean> {
    // Verifica token JWT
    const token = this.authService.getToken();
    if (!token) return false;

    try {
      const decoded = jwt_decode(token);
      const now = Date.now() / 1000;
      
      // Token valido per almeno 1 ora
      return decoded.exp > now + 3600;
    } catch {
      return false;
    }
  }

  async logOfflineActivity(activity: string): Promise<void> {
    const logEntry = {
      id: this.generateId(),
      userId: this.authService.getCurrentUserId(),
      activity,
      timestamp: new Date().toISOString(),
      source: 'offline'
    };

    await this.offlineStorage.addSecurityLog(logEntry);
  }
}
```

### 2. Crittografia Dati Locali

```typescript
@Injectable({
  providedIn: 'root'
})
export class OfflineEncryptionService {
  private readonly algorithm = 'AES-GCM';
  private readonly keyLength = 256;

  async encryptData(data: any): Promise<string> {
    const key = await this.generateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    const encryptedData = await crypto.subtle.encrypt(
      { name: this.algorithm, iv },
      key,
      encodedData
    );

    const encryptedArray = new Uint8Array(encryptedData);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  async decryptData(encryptedData: string): Promise<any> {
    const key = await this.generateKey();
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
      { name: this.algorithm, iv },
      key,
      data
    );

    const decodedData = new TextDecoder().decode(decryptedData);
    return JSON.parse(decodedData);
  }

  private async generateKey(): Promise<CryptoKey> {
    const password = this.authService.getToken() || 'default-key';
    const salt = new TextEncoder().encode('pandom-salt');
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      true,
      ['encrypt', 'decrypt']
    );
  }
}
```

## 📊 Metriche e Monitoraggio

### 1. Offline Analytics

```typescript
@Injectable({
  providedIn: 'root'
})
export class OfflineAnalyticsService {
  async trackOfflineMetrics(): Promise<OfflineMetrics> {
    const metrics: OfflineMetrics = {
      offline_time: this.calculateOfflineTime(),
      operations_queued: this.syncQueue.getPendingOperations().length,
      sync_success_rate: await this.calculateSyncSuccessRate(),
      data_freshness: await this.calculateDataFreshness(),
      last_sync: await this.getLastSyncTime()
    };

    await this.storeMetrics(metrics);
    return metrics;
  }

  private calculateOfflineTime(): number {
    const offlineStart = localStorage.getItem('offline-start');
    if (!offlineStart) return 0;
    
    const startTime = new Date(offlineStart).getTime();
    const now = Date.now();
    return Math.floor((now - startTime) / 1000); // secondi
  }

  private async calculateSyncSuccessRate(): Promise<number> {
    const logs = await this.offlineStorage.getSyncLogs();
    if (logs.length === 0) return 100;

    const successful = logs.filter(log => log.status === 'success').length;
    return (successful / logs.length) * 100;
  }
}
```

### 2. Health Check Offline

```typescript
@Injectable({
  providedIn: 'root'
})
export class OfflineHealthService {
  async checkOfflineHealth(): Promise<OfflineHealthStatus> {
    const status: OfflineHealthStatus = {
      database: await this.checkIndexedDBHealth(),
      storage: await this.checkStorageHealth(),
      sync_queue: await this.checkSyncQueueHealth(),
      security: await this.checkSecurityHealth(),
      timestamp: new Date().toISOString()
    };

    return status;
  }

  private async checkIndexedDBHealth(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      await this.offlineStorage.initializeDB();
      return 'healthy';
    } catch (error) {
      console.error('IndexedDB health check failed:', error);
      return 'down';
    }
  }

  private async checkStorageHealth(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      const quota = await navigator.storage.estimate();
      const usagePercent = (quota.usage || 0) / (quota.quota || 1) * 100;
      
      if (usagePercent < 80) return 'healthy';
      if (usagePercent < 95) return 'degraded';
      return 'down';
    } catch {
      return 'degraded';
    }
  }
}
```

## 🚀 Utilizzo e Best Practices

### 1. Inizializzazione

```typescript
// In app.component.ts
export class AppComponent implements OnInit {
  constructor(
    private offlineStorage: OfflineStorageService,
    private syncQueue: SyncQueueService,
    private offlineSecurity: OfflineSecurityService
  ) {}

  async ngOnInit() {
    // Inizializza servizi offline
    await this.offlineStorage.initializeDB();
    
    // Verifica accesso offline
    const canAccessOffline = await this.offlineSecurity.validateOfflineAccess();
    
    if (canAccessOffline) {
      // Carica dati offline
      await this.loadOfflineData();
    }
  }

  private async loadOfflineData() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      const offlineData = await this.offlineStorage.getUserData(userId);
      if (offlineData) {
        // Aggiorna UI con dati offline
        this.updateUIWithOfflineData(offlineData);
      }
    }
  }
}
```

### 2. Gestione Operazioni Offline

```typescript
// Esempio di aggiornamento profilo offline
async updateProfile(profileData: any) {
  try {
    if (navigator.onLine) {
      // Operazione online
      await this.userService.updateProfile(profileData).toPromise();
    } else {
      // Operazione offline
      await this.offlineDataService.updateProfileOffline(profileData);
      this.notificationService.showInfo('Changes saved offline and will sync when online');
    }
  } catch (error) {
    this.notificationService.showError('Failed to update profile');
  }
}
```

### 3. Sincronizzazione Automatica

```typescript
// Nel sync-queue.service.ts
export class SyncQueueService {
  constructor() {
    // Sincronizza quando torna online
    window.addEventListener('online', () => {
      this.processQueue();
    });

    // Sincronizza periodicamente
    setInterval(() => {
      if (navigator.onLine) {
        this.processQueue();
      }
    }, 5 * 60 * 1000); // Ogni 5 minuti
  }
}
```

## 🧪 Testing Offline

### 1. Test Manuali

```bash
# Test disconnessione
1. Apri DevTools (F12)
2. Vai su Network tab
3. Seleziona "Offline"
4. Prova operazioni offline

# Test sincronizzazione
1. Fai modifiche offline
2. Riconnetti internet
3. Verifica sincronizzazione
4. Controlla log operazioni
```

### 2. Test Automatici

```typescript
// offline.test.ts
describe('Offline Capabilities', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [OfflineStorageService, SyncQueueService]
    }).compileComponents();
  });

  it('should store data offline', async () => {
    const service = TestBed.inject(OfflineStorageService);
    const testData = { user: { id: '1', name: 'Test' } };
    
    await service.storeUserData(testData);
    const retrieved = await service.getUserData('1');
    
    expect(retrieved).toEqual(testData);
  });

  it('should queue operations when offline', async () => {
    const queueService = TestBed.inject(SyncQueueService);
    
    // Simula offline
    spyOn(navigator, 'onLine').and.returnValue(false);
    
    await queueService.addToQueue({
      type: 'UPDATE',
      endpoint: '/api/profile',
      data: { name: 'New Name' }
    });
    
    const pending = queueService.getPendingOperations();
    expect(pending.length).toBe(1);
  });
});
```

## 📈 Metriche di Performance

### 1. Tempi di Risposta

- **Caricamento dati offline**: < 100ms
- **Sincronizzazione**: < 2s per operazione
- **Export dati**: < 1s per 1MB di dati

### 2. Utilizzo Storage

- **IndexedDB**: < 50MB per utente
- **Cache API**: < 100MB totale
- **LocalStorage**: < 5MB

### 3. Tasso di Successo

- **Sincronizzazione**: > 95%
- **Accesso offline**: > 99%
- **Export dati**: > 99%

## 🔧 Configurazione

### 1. Environment Variables

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  offline: {
    enabled: true,
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    syncInterval: 5 * 60 * 1000, // 5 minuti
    retryAttempts: 3,
    retryDelay: 1000 // 1 secondo
  }
};
```

### 2. Service Worker Configuration

```json
// ngsw-config.json
{
  "dataGroups": [
    {
      "name": "api-offline",
      "urls": ["/api/auth/**", "/api/profile/**"],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 50,
        "maxAge": "7d"
      }
    }
  ]
}
```

## 🚨 Troubleshooting

### Problemi Comuni

1. **IndexedDB non disponibile**
   - Verifica supporto browser
   - Controlla modalità incognito
   - Verifica permessi storage

2. **Sincronizzazione fallita**
   - Controlla connessione internet
   - Verifica token di autenticazione
   - Controlla log errori

3. **Dati non aggiornati**
   - Forza refresh cache
   - Verifica timestamp sincronizzazione
   - Controlla conflitti dati

### Debug

```typescript
// Abilita debug offline
localStorage.setItem('debug-offline', 'true');

// Log dettagliati
console.log('Offline Storage:', await this.offlineStorage.getStats());
console.log('Sync Queue:', this.syncQueue.getPendingOperations());
console.log('Network Status:', navigator.onLine);
```

## 📚 Risorse Aggiuntive

- [MDN - Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN - IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MDN - Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Offline First Architecture](https://offlinefirst.org/)

---

Questa documentazione fornisce una guida completa per l'implementazione e l'utilizzo delle capacità offline nel sistema Pandom Stack. Per domande specifiche o problemi, consultare la documentazione API o contattare il team di sviluppo. 