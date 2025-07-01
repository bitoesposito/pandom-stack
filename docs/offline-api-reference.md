# 📚 Offline API Reference - Pandom Stack

## Panoramica

Questa documentazione fornisce un riferimento completo delle API per le funzionalità offline del sistema Pandom Stack. Include interfacce, metodi, eventi e configurazioni per l'implementazione di capacità offline.

## 🔧 Core Services

### OfflineStorageService

Servizio principale per la gestione del database locale IndexedDB.

#### Interfacce

```typescript
interface OfflineUserData {
  user: UserData;
  profile: ProfileData;
  security_logs: SecurityLogEntry[];
  last_sync: string;
  created_at: string;
  updated_at: string;
}

interface OfflineOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: string;
  retry_count: number;
  max_retries: number;
  retry_delay: number;
  priority: 'high' | 'normal' | 'low';
  dependencies?: string[];
}

interface SecurityLogEntry {
  id: number;
  userId: string;
  event_type: string;
  timestamp: string;
  details: any;
  source: 'online' | 'offline';
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}
```

#### Metodi Principali

```typescript
class OfflineStorageService {
  /**
   * Inizializza il database IndexedDB
   * @returns Promise<void>
   */
  async initializeDB(): Promise<void>

  /**
   * Salva dati utente nel database locale
   * @param userData - Dati utente da salvare
   * @returns Promise<void>
   */
  async storeUserData(userData: OfflineUserData): Promise<void>

  /**
   * Recupera dati utente dal database locale
   * @param userId - ID utente
   * @returns Promise<OfflineUserData | null>
   */
  async getUserData(userId: string): Promise<OfflineUserData | null>

  /**
   * Aggiunge un'operazione alla coda di sincronizzazione
   * @param operation - Operazione da aggiungere
   * @returns Promise<void>
   */
  async addPendingOperation(operation: OfflineOperation): Promise<void>

  /**
   * Recupera tutte le operazioni pendenti
   * @returns Promise<OfflineOperation[]>
   */
  async getPendingOperations(): Promise<OfflineOperation[]>

  /**
   * Rimuove un'operazione dalla coda
   * @param operationId - ID operazione da rimuovere
   * @returns Promise<void>
   */
  async removePendingOperation(operationId: string): Promise<void>

  /**
   * Aggiunge un log di sicurezza
   * @param log - Log da aggiungere
   * @returns Promise<void>
   */
  async addSecurityLog(log: Omit<SecurityLogEntry, 'id'>): Promise<void>

  /**
   * Recupera log di sicurezza per un utente
   * @param userId - ID utente
   * @returns Promise<SecurityLogEntry[]>
   */
  async getSecurityLogs(userId: string): Promise<SecurityLogEntry[]>

  /**
   * Pulisce dati obsoleti
   * @param maxAge - Età massima in giorni
   * @returns Promise<void>
   */
  async cleanupOldData(maxAge: number): Promise<void>

  /**
   * Ottiene statistiche del database
   * @returns Promise<DatabaseStats>
   */
  async getDatabaseStats(): Promise<DatabaseStats>
}
```

#### Esempi di Utilizzo

```typescript
// Inizializzazione
const offlineStorage = new OfflineStorageService();
await offlineStorage.initializeDB();

// Salvataggio dati utente
const userData: OfflineUserData = {
  user: { uuid: '123', email: 'user@example.com' },
  profile: { display_name: 'John Doe' },
  security_logs: [],
  last_sync: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

await offlineStorage.storeUserData(userData);

// Aggiunta operazione alla coda
const operation: OfflineOperation = {
  id: 'op-123',
  type: 'UPDATE',
  endpoint: '/api/profile',
  data: { display_name: 'Jane Doe' },
  timestamp: new Date().toISOString(),
  retry_count: 0,
  max_retries: 3,
  retry_delay: 1000,
  priority: 'normal'
};

await offlineStorage.addPendingOperation(operation);
```

### SyncQueueService

Servizio per la gestione della coda di sincronizzazione.

#### Metodi Principali

```typescript
class SyncQueueService {
  /**
   * Aggiunge un'operazione alla coda
   * @param operation - Operazione da aggiungere
   * @returns Promise<void>
   */
  async addToQueue(operation: Omit<OfflineOperation, 'id' | 'timestamp'>): Promise<void>

  /**
   * Processa la coda di sincronizzazione
   * @returns Promise<void>
   */
  async processQueue(): Promise<void>

  /**
   * Processa operazioni critiche immediatamente
   * @returns Promise<void>
   */
  async processCriticalOperations(): Promise<void>

  /**
   * Riprova un'operazione fallita
   * @param operationId - ID operazione da riprovare
   * @returns Promise<void>
   */
  async retryOperation(operationId: string): Promise<void>

  /**
   * Ottiene statistiche della coda
   * @returns Promise<QueueStats>
   */
  async getQueueStats(): Promise<QueueStats>

  /**
   * Pulisce operazioni completate
   * @returns Promise<void>
   */
  async cleanupCompletedOperations(): Promise<void>

  /**
   * Ottiene operazioni per priorità
   * @param priority - Priorità operazioni
   * @returns Promise<OfflineOperation[]>
   */
  async getOperationsByPriority(priority: 'high' | 'normal' | 'low'): Promise<OfflineOperation[]>
}
```

#### Interfacce

```typescript
interface QueueStats {
  total_operations: number;
  pending_operations: number;
  completed_operations: number;
  failed_operations: number;
  high_priority: number;
  normal_priority: number;
  low_priority: number;
  average_processing_time: number;
  last_sync: string;
}

interface SyncResult {
  operation_id: string;
  success: boolean;
  error?: string;
  retry_count: number;
  timestamp: string;
  response_data?: any;
}
```

#### Esempi di Utilizzo

```typescript
// Aggiunta operazione alla coda
await syncQueue.addToQueue({
  type: 'UPDATE',
  endpoint: '/api/profile',
  data: { display_name: 'New Name' },
  retry_count: 0,
  max_retries: 3,
  retry_delay: 1000,
  priority: 'normal'
});

// Processamento coda
await syncQueue.processQueue();

// Statistiche coda
const stats = await syncQueue.getQueueStats();
console.log('Operazioni in coda:', stats.pending_operations);
```

### OfflineDataService

Servizio per la gestione dei dati offline.

#### Metodi Principali

```typescript
class OfflineDataService {
  /**
   * Sincronizza dati utente dal server
   * @param userId - ID utente
   * @returns Promise<void>
   */
  async syncUserData(userId: string): Promise<void>

  /**
   * Ottiene dati utente offline
   * @param userId - ID utente
   * @returns Promise<OfflineUserData | null>
   */
  async getOfflineUserData(userId: string): Promise<OfflineUserData | null>

  /**
   * Aggiorna profilo offline
   * @param profileData - Dati profilo da aggiornare
   * @returns Promise<void>
   */
  async updateProfileOffline(profileData: any): Promise<void>

  /**
   * Esporta dati offline
   * @param userId - ID utente
   * @returns Promise<Blob>
   */
  async exportOfflineData(userId: string): Promise<Blob>

  /**
   * Scarica dati offline
   * @param userId - ID utente
   * @returns Promise<void>
   */
  async downloadOfflineData(userId: string): Promise<void>

  /**
   * Verifica freschezza dati
   * @param userId - ID utente
   * @returns Promise<number> - Età dati in secondi
   */
  async getDataFreshness(userId: string): Promise<number>

  /**
   * Forza sincronizzazione dati
   * @param userId - ID utente
   * @returns Promise<void>
   */
  async forceSync(userId: string): Promise<void>
}
```

#### Esempi di Utilizzo

```typescript
// Sincronizzazione dati
await offlineData.syncUserData('user-123');

// Ottieni dati offline
const userData = await offlineData.getOfflineUserData('user-123');
if (userData) {
  console.log('Dati utente:', userData.user);
  console.log('Profilo:', userData.profile);
}

// Aggiorna profilo offline
await offlineData.updateProfileOffline({
  display_name: 'New Name',
  bio: 'New bio'
});

// Esporta dati
const blob = await offlineData.exportOfflineData('user-123');
const url = URL.createObjectURL(blob);
// Download del file...
```

### OfflineSecurityService

Servizio per la sicurezza offline.

#### Metodi Principali

```typescript
class OfflineSecurityService {
  /**
   * Valida accesso offline
   * @returns Promise<boolean>
   */
  async validateOfflineAccess(): Promise<boolean>

  /**
   * Crittografa dati
   * @param data - Dati da crittografare
   * @returns Promise<string>
   */
  async encryptData(data: any): Promise<string>

  /**
   * Decrittografa dati
   * @param encryptedData - Dati crittografati
   * @returns Promise<any>
   */
  async decryptData(encryptedData: string): Promise<any>

  /**
   * Logga attività offline
   * @param activity - Attività da loggare
   * @returns Promise<void>
   */
  async logOfflineActivity(activity: string): Promise<void>

  /**
   * Verifica integrità dati
   * @param data - Dati da verificare
   * @returns Promise<boolean>
   */
  async verifyDataIntegrity(data: any): Promise<boolean>

  /**
   * Genera hash per dati
   * @param data - Dati per cui generare hash
   * @returns Promise<string>
   */
  async generateDataHash(data: any): Promise<string>

  /**
   * Ottiene log di sicurezza offline
   * @param userId - ID utente
   * @returns Promise<SecurityLogEntry[]>
   */
  async getOfflineSecurityLogs(userId: string): Promise<SecurityLogEntry[]>
}
```

#### Esempi di Utilizzo

```typescript
// Validazione accesso
const canAccess = await offlineSecurity.validateOfflineAccess();
if (!canAccess) {
  throw new Error('Accesso offline non autorizzato');
}

// Crittografia dati sensibili
const sensitiveData = { password: 'secret' };
const encrypted = await offlineSecurity.encryptData(sensitiveData);

// Decrittografia
const decrypted = await offlineSecurity.decryptData(encrypted);

// Log attività
await offlineSecurity.logOfflineActivity('Profile updated offline');

// Verifica integrità
const isValid = await offlineSecurity.verifyDataIntegrity(userData);
```

## 🎨 UI Components

### OfflineBannerComponent

Componente per mostrare lo stato offline.

#### Proprietà

```typescript
interface OfflineBannerProps {
  isOnline: boolean;
  pendingOperations: number;
  lastSync: string;
  onRetry: () => void;
}
```

#### Template

```html
<div *ngIf="!isOnline" class="offline-banner">
  <i class="pi pi-wifi-off"></i>
  <span>You are currently offline. Some features may be limited.</span>
  <span *ngIf="pendingOperations > 0" class="pending-count">
    ({{ pendingOperations }} pending)
  </span>
  <button (click)="onRetry()" class="retry-btn">
    Retry Connection
  </button>
</div>
```

#### Stili

```scss
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
  font-size: 14px;
  
  .retry-btn {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    
    &:hover {
      background: rgba(255,255,255,0.3);
    }
  }
  
  .pending-count {
    background: rgba(255,255,255,0.2);
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 12px;
  }
}
```

### SyncStatusComponent

Componente per mostrare lo stato di sincronizzazione.

#### Proprietà

```typescript
interface SyncStatusProps {
  isSyncing: boolean;
  pendingOperations: number;
  lastSync: string;
  syncProgress: number;
}
```

#### Template

```html
<div class="sync-status" [class.syncing]="isSyncing">
  <i class="pi" [class.pi-sync]="!isSyncing" [class.pi-spin]="isSyncing"></i>
  <span>{{ syncMessage }}</span>
  <span *ngIf="pendingOperations > 0" class="pending-count">
    ({{ pendingOperations }})
  </span>
  <div *ngIf="isSyncing" class="progress-bar">
    <div class="progress-fill" [style.width.%]="syncProgress"></div>
  </div>
</div>
```

### OfflineDataViewerComponent

Componente per visualizzare dati offline.

#### Proprietà

```typescript
interface OfflineDataViewerProps {
  userData: OfflineUserData | null;
  dataFreshness: number;
  onRefresh: () => void;
  onExport: () => void;
}
```

#### Template

```html
<div class="offline-data-viewer">
  <div class="header">
    <h3>Offline Data</h3>
    <div class="actions">
      <button (click)="onRefresh()" class="refresh-btn">
        <i class="pi pi-refresh"></i>
      </button>
      <button (click)="onExport()" class="export-btn">
        <i class="pi pi-download"></i>
      </button>
    </div>
  </div>
  
  <div *ngIf="userData" class="data-content">
    <div class="data-section">
      <h4>User Information</h4>
      <p><strong>Email:</strong> {{ userData.user.email }}</p>
      <p><strong>Role:</strong> {{ userData.user.role }}</p>
    </div>
    
    <div class="data-section">
      <h4>Profile</h4>
      <p><strong>Display Name:</strong> {{ userData.profile?.display_name }}</p>
      <p><strong>Tags:</strong> {{ userData.profile?.tags?.join(', ') }}</p>
    </div>
    
    <div class="data-section">
      <h4>Security Logs</h4>
      <p><strong>Total Logs:</strong> {{ userData.security_logs?.length || 0 }}</p>
    </div>
    
    <div class="data-section">
      <h4>Sync Information</h4>
      <p><strong>Last Sync:</strong> {{ userData.last_sync | date:'medium' }}</p>
      <p><strong>Data Age:</strong> {{ dataFreshness | number:'1.0-0' }} seconds</p>
    </div>
  </div>
  
  <div *ngIf="!userData" class="no-data">
    <i class="pi pi-info-circle"></i>
    <p>No offline data available</p>
  </div>
</div>
```

## 🔧 Configuration

### Environment Configuration

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  offline: {
    enabled: true,
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    syncInterval: 5 * 60 * 1000,     // 5 minuti
    retryAttempts: 3,
    retryDelay: 1000,                // 1 secondo
    encryption: {
      enabled: true,
      algorithm: 'AES-GCM',
      keyLength: 256,
      iterations: 100000
    },
    storage: {
      dbName: 'pandom-offline',
      version: 1,
      maxSize: 50 * 1024 * 1024      // 50MB
    },
    sync: {
      batchSize: 10,
      timeout: 30000,                // 30 secondi
      conflictResolution: 'last-write-wins'
    }
  }
};
```

### Service Worker Configuration

```json
// ngsw-config.json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/favicon.svg",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/**/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api-offline",
      "urls": ["/api/auth/**", "/api/profile/**"],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 50,
        "maxAge": "7d"
      }
    },
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

## 📊 Events

### Offline Events

```typescript
// Eventi per monitorare lo stato offline
interface OfflineEvents {
  // Evento emesso quando l'app va offline
  onOffline: () => void;
  
  // Evento emesso quando l'app torna online
  onOnline: () => void;
  
  // Evento emesso quando la sincronizzazione inizia
  onSyncStart: () => void;
  
  // Evento emesso quando la sincronizzazione completa
  onSyncComplete: (results: SyncResult[]) => void;
  
  // Evento emesso quando la sincronizzazione fallisce
  onSyncError: (error: Error) => void;
  
  // Evento emesso quando i dati vengono aggiornati offline
  onDataUpdated: (data: OfflineUserData) => void;
  
  // Evento emesso quando viene aggiunta un'operazione alla coda
  onOperationQueued: (operation: OfflineOperation) => void;
}
```

### Event Handling

```typescript
// Esempio di gestione eventi
class OfflineEventHandler {
  constructor(
    private pwaService: PwaService,
    private syncQueue: SyncQueueService,
    private offlineData: OfflineDataService
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Monitora stato online/offline
    this.pwaService.isOnline.subscribe(isOnline => {
      if (isOnline) {
        this.handleOnline();
      } else {
        this.handleOffline();
      }
    });

    // Monitora sincronizzazione
    this.syncQueue.onSyncStart(() => {
      console.log('Sync started');
    });

    this.syncQueue.onSyncComplete((results) => {
      console.log('Sync completed:', results);
    });

    this.syncQueue.onSyncError((error) => {
      console.error('Sync error:', error);
    });
  }

  private handleOnline(): void {
    console.log('App is online');
    // Processa coda di sincronizzazione
    this.syncQueue.processQueue();
  }

  private handleOffline(): void {
    console.log('App is offline');
    // Salva timestamp inizio offline
    localStorage.setItem('offline-start', Date.now().toString());
  }
}
```

## 🧪 Testing APIs

### Offline Testing Utilities

```typescript
class OfflineTestUtils {
  /**
   * Simula stato offline
   */
  static simulateOffline(): void {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    
    window.dispatchEvent(new Event('offline'));
  }

  /**
   * Simula stato online
   */
  static simulateOnline(): void {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    
    window.dispatchEvent(new Event('online'));
  }

  /**
   * Pulisce tutti i dati offline
   */
  static async clearOfflineData(): Promise<void> {
    // Pulisce IndexedDB
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name?.includes('pandom-offline')) {
        indexedDB.deleteDatabase(db.name);
      }
    }

    // Pulisce localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('offline') || key.includes('sync')) {
        localStorage.removeItem(key);
      }
    });

    // Pulisce sessionStorage
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.includes('offline') || key.includes('sync')) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Genera dati di test
   */
  static generateTestData(): OfflineUserData {
    return {
      user: {
        uuid: 'test-user-123',
        email: 'test@example.com',
        role: 'user'
      },
      profile: {
        display_name: 'Test User',
        tags: ['test', 'offline'],
        metadata: { test: true }
      },
      security_logs: [
        {
          id: 1,
          userId: 'test-user-123',
          event_type: 'LOGIN',
          timestamp: new Date().toISOString(),
          details: { source: 'offline' },
          source: 'offline'
        }
      ],
      last_sync: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}
```

### Test Examples

```typescript
// Test di funzionalità offline
describe('Offline Functionality', () => {
  beforeEach(async () => {
    await OfflineTestUtils.clearOfflineData();
  });

  it('should store data offline', async () => {
    const offlineStorage = new OfflineStorageService();
    await offlineStorage.initializeDB();

    const testData = OfflineTestUtils.generateTestData();
    await offlineStorage.storeUserData(testData);

    const retrieved = await offlineStorage.getUserData('test-user-123');
    expect(retrieved).toEqual(testData);
  });

  it('should queue operations when offline', async () => {
    OfflineTestUtils.simulateOffline();

    const syncQueue = new SyncQueueService();
    await syncQueue.addToQueue({
      type: 'UPDATE',
      endpoint: '/api/profile',
      data: { display_name: 'New Name' },
      retry_count: 0,
      max_retries: 3,
      retry_delay: 1000,
      priority: 'normal'
    });

    const pending = await syncQueue.getPendingOperations();
    expect(pending.length).toBe(1);
  });

  it('should sync when online', async () => {
    // Setup offline
    OfflineTestUtils.simulateOffline();
    const syncQueue = new SyncQueueService();
    await syncQueue.addToQueue({
      type: 'UPDATE',
      endpoint: '/api/profile',
      data: { display_name: 'New Name' },
      retry_count: 0,
      max_retries: 3,
      retry_delay: 1000,
      priority: 'normal'
    });

    // Simulate online
    OfflineTestUtils.simulateOnline();
    
    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const pending = await syncQueue.getPendingOperations();
    expect(pending.length).toBe(0);
  });
});
```

## 🚨 Error Handling

### Error Types

```typescript
enum OfflineErrorType {
  DATABASE_ERROR = 'DATABASE_ERROR',
  SYNC_ERROR = 'SYNC_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

class OfflineError extends Error {
  constructor(
    message: string,
    public type: OfflineErrorType,
    public details?: any
  ) {
    super(message);
    this.name = 'OfflineError';
  }
}
```

### Error Handling Examples

```typescript
// Gestione errori nel servizio offline
class OfflineErrorHandler {
  static async handleError(error: OfflineError): Promise<void> {
    switch (error.type) {
      case OfflineErrorType.DATABASE_ERROR:
        await this.handleDatabaseError(error);
        break;
      case OfflineErrorType.SYNC_ERROR:
        await this.handleSyncError(error);
        break;
      case OfflineErrorType.ENCRYPTION_ERROR:
        await this.handleEncryptionError(error);
        break;
      default:
        console.error('Unhandled offline error:', error);
    }
  }

  private static async handleDatabaseError(error: OfflineError): Promise<void> {
    console.error('Database error:', error);
    // Tenta di reinizializzare il database
    try {
      const offlineStorage = new OfflineStorageService();
      await offlineStorage.initializeDB();
    } catch (reinitError) {
      console.error('Failed to reinitialize database:', reinitError);
    }
  }

  private static async handleSyncError(error: OfflineError): Promise<void> {
    console.error('Sync error:', error);
    // Aggiunge l'operazione alla coda per retry
    if (error.details?.operation) {
      const syncQueue = new SyncQueueService();
      await syncQueue.addToQueue(error.details.operation);
    }
  }
}
```

Questa documentazione API fornisce un riferimento completo per implementare e utilizzare le funzionalità offline del sistema Pandom Stack, includendo esempi pratici, configurazioni e best practices. 