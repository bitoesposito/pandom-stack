# 🔧 Offline Troubleshooting Guide - Pandom Stack

## Panoramica

Questa guida fornisce soluzioni dettagliate per i problemi più comuni che possono verificarsi con le funzionalità offline del sistema Pandom Stack. Include diagnostica, risoluzione e prevenzione dei problemi.

## 🚨 Problemi Comuni

### 1. IndexedDB non funziona

#### Sintomi
- Errore: "Database not initialized"
- Errore: "IndexedDB not supported"
- Dati non vengono salvati localmente

#### Diagnosi
```javascript
// Verifica supporto IndexedDB
console.log('IndexedDB support:', 'indexedDB' in window);

// Verifica modalità incognito
console.log('Private browsing:', navigator.webdriver);

// Verifica quota storage
navigator.storage.estimate().then(quota => {
  console.log('Storage quota:', quota);
});
```

#### Soluzioni

**Problema: Modalità incognito**
```typescript
// Soluzione: Fallback a localStorage
class OfflineStorageService {
  private useLocalStorage = false;

  async initializeDB(): Promise<void> {
    try {
      // Prova IndexedDB
      await this.initializeIndexedDB();
    } catch (error) {
      console.warn('IndexedDB not available, using localStorage');
      this.useLocalStorage = true;
      await this.initializeLocalStorage();
    }
  }

  private async initializeLocalStorage(): Promise<void> {
    // Implementa storage con localStorage
    if (!localStorage.getItem('offline-storage-version')) {
      localStorage.setItem('offline-storage-version', '1.0');
    }
  }

  async storeUserData(userData: OfflineUserData): Promise<void> {
    if (this.useLocalStorage) {
      localStorage.setItem('user-data', JSON.stringify(userData));
    } else {
      // Usa IndexedDB
      await this.storeInIndexedDB(userData);
    }
  }
}
```

**Problema: Quota esaurita**
```typescript
// Soluzione: Cleanup automatico
class StorageManager {
  async checkStorageQuota(): Promise<number> {
    const quota = await navigator.storage.estimate();
    return (quota.usage || 0) / (quota.quota || 1) * 100;
  }

  async cleanupIfNeeded(): Promise<void> {
    const usagePercent = await this.checkStorageQuota();
    
    if (usagePercent > 80) {
      console.warn('Storage usage high, cleaning up...');
      await this.cleanupOldData();
    }
  }

  private async cleanupOldData(): Promise<void> {
    // Rimuovi dati più vecchi di 30 giorni
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Cleanup IndexedDB
    const offlineStorage = new OfflineStorageService();
    await offlineStorage.cleanupOldData(30);
    
    // Cleanup localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('offline') && this.isOldData(key, thirtyDaysAgo)) {
        localStorage.removeItem(key);
      }
    });
  }
}
```

### 2. Service Worker non si registra

#### Sintomi
- Errore: "Service Worker registration failed"
- App non funziona offline
- Cache non viene utilizzato

#### Diagnosi
```javascript
// Verifica registrazione Service Worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('SW Registrations:', regs);
});

// Verifica HTTPS
console.log('Protocol:', window.location.protocol);

// Verifica path
console.log('SW path:', '/ngsw-worker.js');
```

#### Soluzioni

**Problema: HTTPS richiesto**
```typescript
// Soluzione: Configurazione development
// angular.json
{
  "projects": {
    "frontend": {
      "architect": {
        "serve": {
          "options": {
            "ssl": true,
            "sslCert": "path/to/cert.pem",
            "sslKey": "path/to/key.pem"
          }
        }
      }
    }
  }
}
```

**Problema: Path errato**
```typescript
// Soluzione: Configurazione corretta
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
```

**Problema: Cache non funziona**
```typescript
// Soluzione: Verifica cache
class CacheDebugger {
  async debugCache(): Promise<void> {
    // Verifica cache disponibili
    const cacheNames = await caches.keys();
    console.log('Available caches:', cacheNames);
    
    // Verifica contenuto cache
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      console.log(`Cache ${cacheName}:`, requests.length, 'items');
    }
  }

  async clearAllCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('All caches cleared');
  }
}
```

### 3. Sincronizzazione fallisce

#### Sintomi
- Operazioni rimangono in coda
- Errore: "Sync failed"
- Dati non si aggiornano

#### Diagnosi
```javascript
// Verifica stato rete
console.log('Online:', navigator.onLine);

// Verifica operazioni in coda
const syncQueue = new SyncQueueService();
const pending = await syncQueue.getPendingOperations();
console.log('Pending operations:', pending);

// Verifica token
const token = localStorage.getItem('access_token');
console.log('Token valid:', token ? 'Yes' : 'No');
```

#### Soluzioni

**Problema: Token scaduto**
```typescript
// Soluzione: Refresh token automatico
class TokenManager {
  async refreshTokenIfNeeded(): Promise<boolean> {
    const token = this.authService.getToken();
    if (!token) return false;

    try {
      const decoded = jwt_decode(token);
      const now = Date.now() / 1000;
      
      // Se token scade tra meno di 1 ora, refresh
      if (decoded.exp < now + 3600) {
        return await this.refreshToken();
      }
      
      return true;
    } catch {
      return await this.refreshToken();
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.authService.getRefreshToken();
      if (!refreshToken) return false;

      const response = await this.http.post('/api/auth/refresh', {
        refresh_token: refreshToken
      }).toPromise();

      this.authService.setToken(response.access_token);
      this.authService.setRefreshToken(response.refresh_token);
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }
}
```

**Problema: Connessione instabile**
```typescript
// Soluzione: Retry con exponential backoff
class SyncRetryManager {
  async retryWithBackoff(operation: OfflineOperation): Promise<void> {
    const maxRetries = operation.max_retries || 3;
    const baseDelay = operation.retry_delay || 1000;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.processOperation(operation);
        return; // Success
      } catch (error) {
        console.warn(`Sync attempt ${attempt + 1} failed:`, error);
        
        if (attempt === maxRetries - 1) {
          throw error; // Last attempt failed
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4. Crittografia fallisce

#### Sintomi
- Errore: "Encryption failed"
- Dati non vengono decrittografati
- Accesso negato offline

#### Diagnosi
```javascript
// Verifica supporto Web Crypto API
console.log('Web Crypto support:', 'crypto' in window && 'subtle' in crypto);

// Verifica algoritmi supportati
crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
).then(key => {
  console.log('AES-GCM supported');
}).catch(error => {
  console.error('AES-GCM not supported:', error);
});
```

#### Soluzioni

**Problema: Algoritmo non supportato**
```typescript
// Soluzione: Fallback a algoritmi supportati
class EncryptionManager {
  private async getSupportedAlgorithm(): Promise<string> {
    const algorithms = ['AES-GCM', 'AES-CBC', 'AES-CTR'];
    
    for (const algorithm of algorithms) {
      try {
        await crypto.subtle.generateKey(
          { name: algorithm, length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        return algorithm;
      } catch {
        continue;
      }
    }
    
    throw new Error('No supported encryption algorithm found');
  }

  async encryptData(data: any): Promise<string> {
    const algorithm = await this.getSupportedAlgorithm();
    // Implementa crittografia con algoritmo supportato
    return this.encryptWithAlgorithm(data, algorithm);
  }
}
```

### 5. Performance Offline

#### Sintomi
- App lenta offline
- Caricamento dati lento
- UI non responsive

#### Diagnosi
```javascript
// Verifica performance
console.time('offline-data-load');
// ... carica dati
console.timeEnd('offline-data-load');

// Verifica dimensione dati
const userData = await offlineStorage.getUserData(userId);
console.log('Data size:', JSON.stringify(userData).length, 'bytes');
```

#### Soluzioni

**Problema: Dati troppo grandi**
```typescript
// Soluzione: Compressione dati
class DataCompressor {
  async compressData(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    
    // Compressione con gzip
    const compressed = await this.gzipCompress(dataBuffer);
    return btoa(String.fromCharCode(...compressed));
  }

  async decompressData(compressedData: string): Promise<any> {
    const compressed = new Uint8Array(
      atob(compressedData).split('').map(char => char.charCodeAt(0))
    );
    
    const decompressed = await this.gzipDecompress(compressed);
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decompressed);
    
    return JSON.parse(jsonString);
  }
}
```

## 🔍 Debug Tools

### 1. Offline Debug Panel

```typescript
@Component({
  selector: 'app-offline-debug',
  template: `
    <div class="debug-panel" *ngIf="showDebug">
      <h3>Offline Debug</h3>
      
      <div class="debug-section">
        <h4>Network Status</h4>
        <p>Online: {{ isOnline }}</p>
        <p>Connection Type: {{ connectionType }}</p>
      </div>
      
      <div class="debug-section">
        <h4>Storage Status</h4>
        <p>IndexedDB: {{ storageStatus.database }}</p>
        <p>Usage: {{ storageStatus.usage }}%</p>
        <p>Data Size: {{ storageStatus.dataSize }} bytes</p>
      </div>
      
      <div class="debug-section">
        <h4>Sync Status</h4>
        <p>Pending Operations: {{ syncStatus.pending }}</p>
        <p>Last Sync: {{ syncStatus.lastSync }}</p>
        <p>Success Rate: {{ syncStatus.successRate }}%</p>
      </div>
      
      <div class="debug-actions">
        <button (click)="refreshDebug()">Refresh</button>
        <button (click)="clearCache()">Clear Cache</button>
        <button (click)="forceSync()">Force Sync</button>
      </div>
    </div>
  `
})
export class OfflineDebugComponent {
  showDebug = !environment.production;
  isOnline = navigator.onLine;
  connectionType = 'unknown';
  storageStatus: any = {};
  syncStatus: any = {};

  constructor(
    private offlineStorage: OfflineStorageService,
    private syncQueue: SyncQueueService
  ) {}

  async refreshDebug(): Promise<void> {
    this.isOnline = navigator.onLine;
    this.connectionType = await this.getConnectionType();
    this.storageStatus = await this.getStorageStatus();
    this.syncStatus = await this.getSyncStatus();
  }

  async clearCache(): Promise<void> {
    await this.offlineStorage.clearAllData();
    await this.refreshDebug();
  }

  async forceSync(): Promise<void> {
    await this.syncQueue.processQueue();
    await this.refreshDebug();
  }
}
```

### 2. Console Debug Commands

```typescript
// Aggiungi al window object per debug
(window as any).offlineDebug = {
  // Verifica stato offline
  checkOfflineStatus: () => {
    console.log('Online:', navigator.onLine);
    console.log('Service Worker:', 'serviceWorker' in navigator);
    console.log('IndexedDB:', 'indexedDB' in window);
  },

  // Verifica storage
  checkStorage: async () => {
    const quota = await navigator.storage.estimate();
    console.log('Storage quota:', quota);
    
    const databases = await indexedDB.databases();
    console.log('IndexedDB databases:', databases);
  },

  // Verifica cache
  checkCache: async () => {
    const cacheNames = await caches.keys();
    console.log('Cache names:', cacheNames);
    
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      console.log(`Cache ${name}:`, requests.length, 'items');
    }
  },

  // Verifica operazioni sync
  checkSync: async () => {
    const syncQueue = new SyncQueueService();
    const pending = await syncQueue.getPendingOperations();
    console.log('Pending operations:', pending);
  },

  // Pulisci tutto
  clearAll: async () => {
    // Pulisci cache
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    // Pulisci IndexedDB
    const databases = await indexedDB.databases();
    await Promise.all(databases.map(db => indexedDB.deleteDatabase(db.name!)));
    
    // Pulisci localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('offline') || key.includes('sync')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('All offline data cleared');
  }
};
```

## 📊 Monitoring e Alerting

### 1. Health Check Automatico

```typescript
class OfflineHealthMonitor {
  private checkInterval: number = 5 * 60 * 1000; // 5 minuti

  startMonitoring(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);
  }

  private async performHealthCheck(): Promise<void> {
    const health = await this.checkHealth();
    
    if (health.status === 'unhealthy') {
      this.sendAlert(health);
    }
    
    this.logHealthMetrics(health);
  }

  private async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkStorageHealth(),
      this.checkSyncHealth(),
      this.checkSecurityHealth()
    ]);

    const status = checks.every(check => check === 'healthy') 
      ? 'healthy' 
      : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      checks
    };
  }

  private async checkDatabaseHealth(): Promise<'healthy' | 'unhealthy'> {
    try {
      await this.offlineStorage.initializeDB();
      return 'healthy';
    } catch {
      return 'unhealthy';
    }
  }

  private async checkStorageHealth(): Promise<'healthy' | 'unhealthy'> {
    try {
      const quota = await navigator.storage.estimate();
      const usagePercent = (quota.usage || 0) / (quota.quota || 1) * 100;
      return usagePercent < 90 ? 'healthy' : 'unhealthy';
    } catch {
      return 'unhealthy';
    }
  }

  private sendAlert(health: HealthStatus): void {
    console.error('Offline health check failed:', health);
    // Implementa invio alert (email, webhook, etc.)
  }
}
```

### 2. Metriche Performance

```typescript
class OfflineMetricsCollector {
  private metrics: OfflineMetrics[] = [];

  async collectMetrics(): Promise<OfflineMetrics> {
    const metrics: OfflineMetrics = {
      timestamp: new Date().toISOString(),
      offline_time: this.calculateOfflineTime(),
      operations_queued: await this.getQueuedOperations(),
      sync_success_rate: await this.getSyncSuccessRate(),
      data_freshness: await this.getDataFreshness(),
      storage_usage: await this.getStorageUsage(),
      performance: await this.getPerformanceMetrics()
    };

    this.metrics.push(metrics);
    this.cleanupOldMetrics();
    
    return metrics;
  }

  private calculateOfflineTime(): number {
    const offlineStart = localStorage.getItem('offline-start');
    if (!offlineStart) return 0;
    
    const startTime = new Date(offlineStart).getTime();
    const now = Date.now();
    return Math.floor((now - startTime) / 1000);
  }

  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      load_time: navigation.loadEventEnd - navigation.loadEventStart,
      dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      first_paint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      first_contentful_paint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
    };
  }

  getMetricsHistory(): OfflineMetrics[] {
    return this.metrics;
  }

  private cleanupOldMetrics(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(
      metric => new Date(metric.timestamp).getTime() > oneDayAgo
    );
  }
}
```

## 🚨 Error Recovery

### 1. Auto-Recovery Strategies

```typescript
class OfflineRecoveryManager {
  async attemptRecovery(error: OfflineError): Promise<boolean> {
    switch (error.type) {
      case OfflineErrorType.DATABASE_ERROR:
        return await this.recoverDatabase();
      case OfflineErrorType.SYNC_ERROR:
        return await this.recoverSync();
      case OfflineErrorType.STORAGE_ERROR:
        return await this.recoverStorage();
      default:
        return false;
    }
  }

  private async recoverDatabase(): Promise<boolean> {
    try {
      // Tenta di reinizializzare il database
      await this.offlineStorage.initializeDB();
      
      // Verifica integrità dati
      const isHealthy = await this.verifyDataIntegrity();
      
      if (!isHealthy) {
        // Ripristina da backup se disponibile
        await this.restoreFromBackup();
      }
      
      return true;
    } catch (error) {
      console.error('Database recovery failed:', error);
      return false;
    }
  }

  private async recoverSync(): Promise<boolean> {
    try {
      // Pulisci operazioni corrotte
      await this.cleanupCorruptedOperations();
      
      // Riprova operazioni critiche
      await this.retryCriticalOperations();
      
      return true;
    } catch (error) {
      console.error('Sync recovery failed:', error);
      return false;
    }
  }

  private async verifyDataIntegrity(): Promise<boolean> {
    // Implementa verifica integrità dati
    // Checksum, validazione schema, etc.
    return true;
  }

  private async restoreFromBackup(): Promise<void> {
    // Implementa ripristino da backup
    // Backup locale, cloud, etc.
  }
}
```

### 2. Manual Recovery Procedures

```typescript
class ManualRecoveryProcedures {
  async resetOfflineData(): Promise<void> {
    console.warn('Resetting all offline data...');
    
    // Pulisci IndexedDB
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name?.includes('pandom-offline')) {
        await indexedDB.deleteDatabase(db.name);
      }
    }
    
    // Pulisci cache
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    // Pulisci localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('offline') || key.includes('sync')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Offline data reset completed');
  }

  async exportOfflineData(): Promise<Blob> {
    const allData = {
      users: await this.exportUsers(),
      operations: await this.exportOperations(),
      logs: await this.exportLogs(),
      metadata: {
        exported_at: new Date().toISOString(),
        version: '1.0'
      }
    };
    
    const jsonString = JSON.stringify(allData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  async importOfflineData(blob: Blob): Promise<void> {
    const text = await blob.text();
    const data = JSON.parse(text);
    
    // Importa dati nel database
    await this.importUsers(data.users);
    await this.importOperations(data.operations);
    await this.importLogs(data.logs);
    
    console.log('Offline data import completed');
  }
}
```

## 📋 Checklist Troubleshooting

### Pre-Implementazione
- [ ] Verifica supporto browser per IndexedDB
- [ ] Verifica supporto Service Worker
- [ ] Verifica supporto Web Crypto API
- [ ] Configura HTTPS per development
- [ ] Testa modalità incognito

### Post-Implementazione
- [ ] Testa funzionalità offline
- [ ] Verifica sincronizzazione
- [ ] Controlla performance
- [ ] Testa gestione errori
- [ ] Verifica sicurezza

### Monitoraggio Continuo
- [ ] Monitora metriche performance
- [ ] Controlla errori sincronizzazione
- [ ] Verifica utilizzo storage
- [ ] Monitora success rate
- [ ] Controlla integrità dati

## 🎯 Best Practices

### 1. Gestione Errori
- **Sempre cattura errori** nelle operazioni offline
- **Implementa retry logic** con exponential backoff
- **Fornisci feedback utente** per errori critici
- **Logga errori** per debugging

### 2. Performance
- **Comprimi dati** quando possibile
- **Usa indici** per query frequenti
- **Implementa paginazione** per grandi dataset
- **Monitora utilizzo storage**

### 3. Sicurezza
- **Valida sempre** i dati offline
- **Crittografa** dati sensibili
- **Implementa audit trail** completo
- **Gestisci scadenza** token offline

### 4. UX
- **Mostra stato offline** chiaramente
- **Fornisci feedback** per operazioni
- **Implementa retry** manuale
- **Mostra progresso** sincronizzazione

## 🚀 Quick Fix Commands

### Comandi Console per Debug Rapido

```javascript
// Verifica stato generale
offlineDebug.checkOfflineStatus();

// Verifica storage
offlineDebug.checkStorage();

// Verifica cache
offlineDebug.checkCache();

// Verifica sync
offlineDebug.checkSync();

// Pulisci tutto (nuclear option)
offlineDebug.clearAll();

// Forza sync
syncQueue.processQueue();

// Verifica token
console.log('Token:', localStorage.getItem('access_token'));

// Verifica quota
navigator.storage.estimate().then(q => console.log('Quota:', q));
```

### Comandi per Problemi Specifici

```javascript
// Problema: IndexedDB non funziona
console.log('IndexedDB support:', 'indexedDB' in window);
console.log('Private mode:', navigator.webdriver);

// Problema: Service Worker non registrato
navigator.serviceWorker.getRegistrations().then(regs => 
  console.log('SW registrations:', regs)
);

// Problema: Cache vuoto
caches.keys().then(names => console.log('Caches:', names));

// Problema: Sync fallisce
console.log('Online:', navigator.onLine);
console.log('Token valid:', !!localStorage.getItem('access_token'));

// Problema: Performance
console.time('data-load');
// ... operazione
console.timeEnd('data-load');
```

Questa guida di troubleshooting fornisce soluzioni complete per i problemi più comuni delle funzionalità offline, includendo diagnostica, risoluzione e prevenzione. 