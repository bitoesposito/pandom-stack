# 🛠️ Offline Implementation Guide - Pandom Stack

## Panoramica

Questa guida pratica fornisce istruzioni dettagliate per implementare le funzionalità offline nel sistema Pandom Stack. È strutturata per essere seguita passo dopo passo durante l'hackathon.

## 📋 Prerequisiti

### Software Richiesto
- Node.js 18+
- Angular CLI 17+
- Docker & Docker Compose
- Git

### Conoscenze Base
- TypeScript/Angular
- Service Workers
- IndexedDB
- HTTP/REST APIs

## 🚀 Implementazione Step-by-Step

### FASE 1: Setup Base Offline (2-3 ore)

#### Step 1.1: Verifica PWA Base

```bash
# Verifica configurazione PWA esistente
cd frontend
npm run build
# Verifica che ngsw-worker.js sia generato in dist/
```

#### Step 1.2: Crea Offline Storage Service

```typescript
// frontend/src/app/services/offline-storage.service.ts
import { Injectable } from '@angular/core';

export interface OfflineUserData {
  user: any;
  profile: any;
  security_logs: any[];
  last_sync: string;
}

export interface OfflineOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: string;
}

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

  async addPendingOperation(operation: OfflineOperation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['pendingOperations'], 'readwrite');
    const store = transaction.objectStore('pendingOperations');
    
    return new Promise((resolve, reject) => {
      const request = store.add(operation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingOperations(): Promise<OfflineOperation[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['pendingOperations'], 'readonly');
    const store = transaction.objectStore('pendingOperations');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingOperation(operationId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['pendingOperations'], 'readwrite');
    const store = transaction.objectStore('pendingOperations');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(operationId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async addSecurityLog(log: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['securityLogs'], 'readwrite');
    const store = transaction.objectStore('securityLogs');
    
    return new Promise((resolve, reject) => {
      const request = store.add(log);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSecurityLogs(userId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['securityLogs'], 'readonly');
    const store = transaction.objectStore('securityLogs');
    const index = store.index('userId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(userId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}
```

#### Step 1.3: Crea Sync Queue Service

```typescript
// frontend/src/app/services/sync-queue.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { OfflineStorageService, OfflineOperation } from './offline-storage.service';

@Injectable({
  providedIn: 'root'
})
export class SyncQueueService {
  private isSyncing = false;
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor(
    private http: HttpClient,
    private offlineStorage: OfflineStorageService
  ) {
    this.initializeSync();
  }

  private initializeSync(): void {
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

  async addToQueue(operation: Omit<OfflineOperation, 'id' | 'timestamp'>): Promise<void> {
    const fullOperation: OfflineOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };

    await this.offlineStorage.addPendingOperation(fullOperation);
  }

  async processQueue(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;
    
    this.isSyncing = true;
    const operations = await this.offlineStorage.getPendingOperations();
    
    for (const operation of operations) {
      try {
        await this.processOperation(operation);
        await this.offlineStorage.removePendingOperation(operation.id);
      } catch (error) {
        console.error('Sync operation failed:', error);
        // Implementa retry logic se necessario
      }
    }
    
    this.isSyncing = false;
  }

  private async processOperation(operation: OfflineOperation): Promise<void> {
    const { type, endpoint, data } = operation;
    const url = `${environment.apiUrl}${endpoint}`;
    
    switch (type) {
      case 'CREATE':
        await this.http.post(url, data).toPromise();
        break;
      case 'UPDATE':
        await this.http.put(url, data).toPromise();
        break;
      case 'DELETE':
        await this.http.delete(url).toPromise();
        break;
    }
  }

  getPendingOperations(): OfflineOperation[] {
    return this.offlineStorage.getPendingOperations();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
```

### FASE 2: Integrazione UI (1-2 ore)

#### Step 2.1: Crea Offline Banner Component

```typescript
// frontend/src/app/components/offline-banner/offline-banner.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../services/pwa.service';
import { SyncQueueService } from '../../services/sync-queue.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="!isOnline" class="offline-banner">
      <i class="pi pi-wifi-off"></i>
      <span>You are currently offline. Some features may be limited.</span>
      <button (click)="retryConnection()" class="retry-btn">
        Retry Connection
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
      font-size: 14px;
    }
    
    .retry-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .retry-btn:hover {
      background: rgba(255,255,255,0.3);
    }
  `]
})
export class OfflineBannerComponent implements OnInit {
  isOnline = true;

  constructor(
    private pwaService: PwaService,
    private syncQueue: SyncQueueService
  ) {}

  ngOnInit() {
    this.pwaService.isOnline.subscribe(online => {
      this.isOnline = online;
    });
  }

  retryConnection(): void {
    this.syncQueue.processQueue();
  }
}
```

#### Step 2.2: Crea Sync Status Component

```typescript
// frontend/src/app/components/sync-status/sync-status.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SyncQueueService } from '../../services/sync-queue.service';

@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [CommonModule],
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
      font-size: 12px;
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
      font-size: 10px;
    }
  `]
})
export class SyncStatusComponent implements OnInit {
  isSyncing = false;
  pendingOperations = 0;
  syncMessage = '';

  constructor(private syncQueue: SyncQueueService) {}

  ngOnInit() {
    this.updateStatus();
    // Aggiorna status ogni 5 secondi
    setInterval(() => this.updateStatus(), 5000);
  }

  private updateStatus(): void {
    this.pendingOperations = this.syncQueue.getPendingOperations().length;
    this.syncMessage = this.pendingOperations > 0 
      ? 'Pending sync' 
      : 'All synced';
  }
}
```

#### Step 2.3: Integra Componenti nel Dashboard

```typescript
// frontend/src/app/private/dashboard/dashboard.component.ts
// Aggiungi ai imports:
import { OfflineBannerComponent } from '../../components/offline-banner/offline-banner.component';
import { SyncStatusComponent } from '../../components/sync-status/sync-status.component';

// Aggiungi ai component imports:
imports: [
  // ... altri imports
  OfflineBannerComponent,
  SyncStatusComponent
]
```

```html
<!-- frontend/src/app/private/dashboard/dashboard.component.html -->
<!-- Aggiungi all'inizio del template: -->
<app-offline-banner></app-offline-banner>

<!-- Aggiungi nella sidebar o header: -->
<app-sync-status></app-sync-status>
```

### FASE 3: Offline Data Management (2-3 ore)

#### Step 3.1: Crea Offline Data Service

```typescript
// frontend/src/app/services/offline-data.service.ts
import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { OfflineStorageService, OfflineUserData } from './offline-storage.service';
import { SyncQueueService } from './sync-queue.service';

@Injectable({
  providedIn: 'root'
})
export class OfflineDataService {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private offlineStorage: OfflineStorageService,
    private syncQueue: SyncQueueService
  ) {}

  async syncUserData(userId: string): Promise<void> {
    try {
      // Sincronizza dati utente dal server
      const userData = await this.userService.getUser(userId).toPromise();
      
      // Salva in IndexedDB
      await this.offlineStorage.storeUserData({
        user: userData.data.user,
        profile: userData.data.profile,
        security_logs: userData.data.security_logs || [],
        last_sync: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to sync user data:', error);
    }
  }

  async getOfflineUserData(userId: string): Promise<OfflineUserData | null> {
    return await this.offlineStorage.getUserData(userId);
  }

  async updateProfileOffline(profileData: any): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Salva modifica in coda sync
    await this.syncQueue.addToQueue({
      type: 'UPDATE',
      endpoint: '/profile',
      data: profileData
    });

    // Aggiorna cache locale
    const currentData = await this.getOfflineUserData(userId);
    if (currentData) {
      currentData.profile = { ...currentData.profile, ...profileData };
      await this.offlineStorage.storeUserData(currentData);
    }
  }

  async exportOfflineData(userId: string): Promise<Blob> {
    const userData = await this.getOfflineUserData(userId);
    
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
    const blob = await this.exportOfflineData(userId);
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

#### Step 3.2: Integra nel Profile Service

```typescript
// frontend/src/app/services/user.service.ts
// Aggiungi import:
import { OfflineDataService } from './offline-data.service';

// Aggiungi al constructor:
constructor(
  private http: HttpClient,
  private authService: AuthService,
  private offlineData: OfflineDataService
) {}

// Modifica updateUser per supportare offline:
async updateUser(email: string, data: any): Promise<any> {
  try {
    if (navigator.onLine) {
      // Operazione online
      return await this.http.put<ApiResponse<UserEmail>>(
        `${this.API_URL}/users/update`, 
        {email, data}, 
        { headers: this.getHeaders() }
      ).toPromise();
    } else {
      // Operazione offline
      await this.offlineData.updateProfileOffline(data);
      return { success: true, message: 'Changes saved offline' };
    }
  } catch (error) {
    throw error;
  }
}
```

### FASE 4: Testing e Debug (1-2 ore)

#### Step 4.1: Crea Test Manuali

```typescript
// frontend/src/app/services/offline-debug.service.ts
import { Injectable } from '@angular/core';
import { OfflineStorageService } from './offline-storage.service';
import { SyncQueueService } from './sync-queue.service';

@Injectable({
  providedIn: 'root'
})
export class OfflineDebugService {
  constructor(
    private offlineStorage: OfflineStorageService,
    private syncQueue: SyncQueueService
  ) {}

  async debugOfflineStatus(): Promise<any> {
    const status = {
      online: navigator.onLine,
      storage: await this.checkStorageStatus(),
      sync: await this.checkSyncStatus(),
      data: await this.checkDataStatus()
    };

    console.log('Offline Debug Status:', status);
    return status;
  }

  private async checkStorageStatus(): Promise<any> {
    try {
      await this.offlineStorage.initializeDB();
      return { status: 'healthy', message: 'IndexedDB working' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  private async checkSyncStatus(): Promise<any> {
    const pending = this.syncQueue.getPendingOperations();
    return {
      pending_operations: pending.length,
      operations: pending
    };
  }

  private async checkDataStatus(): Promise<any> {
    const userId = 'test-user'; // Sostituisci con user ID reale
    const userData = await this.offlineStorage.getUserData(userId);
    return {
      has_user_data: !!userData,
      last_sync: userData?.last_sync,
      data_size: userData ? JSON.stringify(userData).length : 0
    };
  }
}
```

#### Step 4.2: Aggiungi Debug UI

```typescript
// frontend/src/app/components/debug-panel/debug-panel.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineDebugService } from '../../services/offline-debug.service';

@Component({
  selector: 'app-debug-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="showDebug" class="debug-panel">
      <h3>Offline Debug</h3>
      <pre>{{ debugInfo | json }}</pre>
      <button (click)="refreshDebug()">Refresh</button>
    </div>
  `,
  styles: [`
    .debug-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #f5f5f5;
      border: 1px solid #ddd;
      padding: 16px;
      border-radius: 8px;
      max-width: 400px;
      max-height: 300px;
      overflow: auto;
      z-index: 1000;
    }
    
    pre {
      font-size: 12px;
      margin: 8px 0;
    }
  `]
})
export class DebugPanelComponent {
  showDebug = false;
  debugInfo: any = {};

  constructor(private debugService: OfflineDebugService) {
    // Mostra debug solo in development
    this.showDebug = !environment.production;
  }

  async refreshDebug(): Promise<void> {
    this.debugInfo = await this.debugService.debugOfflineStatus();
  }

  ngOnInit() {
    this.refreshDebug();
  }
}
```

## 🧪 Test Scenarios

### Scenario 1: Offline Login
```bash
1. Disconnetti internet (DevTools > Network > Offline)
2. Prova a fare login
3. Verifica che i dati vengano caricati da cache
4. Controlla che l'UI mostri banner offline
```

### Scenario 2: Offline Data Modification
```bash
1. Vai offline
2. Modifica profilo utente
3. Verifica che le modifiche vengano salvate in coda
4. Riconnetti internet
5. Verifica sincronizzazione automatica
```

### Scenario 3: Offline Data Export
```bash
1. Vai offline
2. Richiedi export dati utente
3. Verifica download file JSON
4. Controlla integrità dati esportati
```

## 🔧 Configurazione Avanzata

### Service Worker Personalizzato

```typescript
// frontend/src/app/sw-custom.js
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Gestione personalizzata delle richieste
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Fallback per richieste API offline
          return new Response(JSON.stringify({ offline: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
  }
});
```

### Configurazione IndexedDB Avanzata

```typescript
// Configurazione con migrazioni
const DB_VERSION = 2;

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;
  
  if (oldVersion < 1) {
    // Versione 1: tabelle base
    db.createObjectStore('users', { keyPath: 'uuid' });
  }
  
  if (oldVersion < 2) {
    // Versione 2: aggiungi indici
    const userStore = db.objectStore('users');
    userStore.createIndex('email', 'email', { unique: true });
  }
};
```

## 🚨 Troubleshooting

### Problemi Comuni

1. **IndexedDB non funziona**
   ```bash
   # Verifica supporto browser
   console.log('IndexedDB support:', 'indexedDB' in window);
   
   # Verifica modalità incognito
   # IndexedDB può essere limitato in modalità incognito
   ```

2. **Service Worker non si registra**
   ```bash
   # Verifica HTTPS in produzione
   # Service Worker richiede HTTPS (tranne localhost)
   
   # Verifica path corretto
   # ngsw-worker.js deve essere nella root del build
   ```

3. **Sincronizzazione fallisce**
   ```bash
   # Controlla token di autenticazione
   # Verifica endpoint API
   # Controlla CORS settings
   ```

### Debug Commands

```typescript
// Nel browser console
// Verifica stato offline
console.log('Online:', navigator.onLine);

// Verifica IndexedDB
indexedDB.databases().then(dbs => console.log('Databases:', dbs));

// Verifica Service Worker
navigator.serviceWorker.getRegistrations().then(regs => 
  console.log('SW Registrations:', regs)
);

// Verifica cache
caches.keys().then(keys => console.log('Cache keys:', keys));
```

## 📊 Metriche di Successo

### Performance Targets
- **Caricamento dati offline**: < 100ms
- **Sincronizzazione**: < 2s per operazione
- **Export dati**: < 1s per 1MB

### Quality Metrics
- **Uptime offline**: > 99%
- **Sync success rate**: > 95%
- **Data integrity**: 100%

## 🎯 Demo per Hackathon

### Demo Script
```bash
# 1. Setup
docker-compose up -d
npm run build
npm start

# 2. Demo Offline Resilience
- Login utente
- Disconnetti internet
- Modifica profilo
- Verifica operazione in coda
- Riconnetti internet
- Verifica sincronizzazione

# 3. Demo Data Export
- Vai offline
- Richiedi export dati
- Verifica download locale
- Controlla integrità dati

# 4. Demo Security
- Simula attacco offline
- Verifica log locali
- Export dati per analisi
- Sync quando online
```

Questa guida fornisce tutti i passaggi necessari per implementare un sistema offline completo e funzionale per il tuo hackathon. Segui i passaggi in ordine e testa ogni fase prima di procedere alla successiva. 