import { Injectable } from '@angular/core';

export interface OfflineUserData {
  user: any;
  profile: any;
  security_logs: any[];
  last_sync: string;
  created_at: string;
  updated_at: string;
}

export interface OfflineOperation {
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

export interface SecurityLogEntry {
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

export interface DatabaseStats {
  total_users: number;
  total_operations: number;
  total_logs: number;
  storage_size: number;
  last_cleanup: string;
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
          userStore.createIndex('last_sync', 'last_sync', { unique: false });
        }

        // Store per operazioni pendenti
        if (!db.objectStoreNames.contains('pendingOperations')) {
          const operationStore = db.createObjectStore('pendingOperations', { keyPath: 'id' });
          operationStore.createIndex('timestamp', 'timestamp', { unique: false });
          operationStore.createIndex('priority', 'priority', { unique: false });
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

  async getAllUsers(): Promise<OfflineUserData[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteUserData(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(userId);
      request.onsuccess = () => resolve();
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

  async getOperationsByPriority(priority: 'high' | 'normal' | 'low'): Promise<OfflineOperation[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['pendingOperations'], 'readonly');
    const store = transaction.objectStore('pendingOperations');
    const index = store.index('priority');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(priority);
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

  async updatePendingOperation(operation: OfflineOperation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['pendingOperations'], 'readwrite');
    const store = transaction.objectStore('pendingOperations');
    
    return new Promise((resolve, reject) => {
      const request = store.put(operation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async addSecurityLog(log: Omit<SecurityLogEntry, 'id'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['securityLogs'], 'readwrite');
    const store = transaction.objectStore('securityLogs');
    
    return new Promise((resolve, reject) => {
      const request = store.add(log);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSecurityLogs(userId: string): Promise<SecurityLogEntry[]> {
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

  async getAllSecurityLogs(): Promise<SecurityLogEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['securityLogs'], 'readonly');
    const store = transaction.objectStore('securityLogs');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async cleanupOldData(maxAge: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const cutoffDate = new Date(Date.now() - (maxAge * 24 * 60 * 60 * 1000)).toISOString();
    
    // Pulisci log di sicurezza vecchi
    const transaction = this.db.transaction(['securityLogs'], 'readwrite');
    const store = transaction.objectStore('securityLogs');
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffDate));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getDatabaseStats(): Promise<DatabaseStats> {
    if (!this.db) throw new Error('Database not initialized');
    
    const [users, operations, logs] = await Promise.all([
      this.getAllUsers(),
      this.getPendingOperations(),
      this.getAllSecurityLogs()
    ]);

    // Calcola dimensione storage approssimativa
    const storageSize = JSON.stringify({ users, operations, logs }).length;

    return {
      total_users: users.length,
      total_operations: operations.length,
      total_logs: logs.length,
      storage_size: storageSize,
      last_cleanup: new Date().toISOString()
    };
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stores = ['users', 'pendingOperations', 'securityLogs', 'offlineMetrics'];
    
    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
} 