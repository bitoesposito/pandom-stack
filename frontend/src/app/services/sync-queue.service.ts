import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  OfflineStorageService
} from './offline-storage.service';
import {
  OfflineOperation,
  QueueStats,
  SyncResult
} from '../models/offline.models';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class SyncQueueService {
  private isSyncing = false;
  private retryAttempts = 3;
  private retryDelay = 1000;
  private syncResults: SyncResult[] = [];

  constructor(
    private http: HttpClient,
    private offlineStorage: OfflineStorageService,
    private notification: NotificationService
  ) {
    this.initializeSync();
  }

  private initializeSync(): void {
    // Sincronizza quando torna online
    window.addEventListener('online', () => {
      console.log('Network online, processing sync queue...');
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
      timestamp: new Date().toISOString(),
      retry_count: 0,
      max_retries: operation.max_retries || this.retryAttempts,
      retry_delay: operation.retry_delay || this.retryDelay,
      priority: operation.priority || 'normal'
    };
    await this.offlineStorage.addPendingOperation(fullOperation);
    this.notification.handleInfo('Operazione accodata per la sincronizzazione offline');
  }

  async processQueue(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) {
      return;
    }
    this.isSyncing = true;
    this.notification.handleInfo('Sincronizzazione offline in corso...');
    try {
      const operations = await this.offlineStorage.getPendingOperations();
      const sortedOperations = this.sortOperationsByPriority(operations);
      for (const operation of sortedOperations) {
        try {
          await this.processOperation(operation);
          await this.offlineStorage.removePendingOperation(operation.id);
          this.notification.handleSuccess('Operazione sincronizzata con successo');
        } catch (error) {
          this.notification.handleError(error, 'Errore durante la sincronizzazione di un\'operazione offline');
        }
      }
    } finally {
      this.isSyncing = false;
      this.notification.handleInfo('Sincronizzazione offline completata');
    }
  }

  async processCriticalOperations(): Promise<void> {
    if (!navigator.onLine) return;

    const highPriorityOps = await this.getOperationsByPriority('high');

    for (const operation of highPriorityOps) {
      try {
        await this.processOperation(operation);
        await this.offlineStorage.removePendingOperation(operation.id);
        console.log('Critical operation processed:', operation.id);
      } catch (error) {
        console.error('Critical operation failed:', error);
      }
    }
  }

  async retryOperation(operationId: string): Promise<void> {
    const operations = await this.offlineStorage.getPendingOperations();
    const operation = operations.find(op => op.id === operationId);

    if (!operation) {
      throw new Error('Operation not found in queue');
    }

    try {
      await this.processOperation(operation);
      await this.offlineStorage.removePendingOperation(operationId);
      console.log('Operation retry successful:', operationId);
    } catch (error) {
      console.error('Operation retry failed:', error);
      throw error;
    }
  }

  private async processOperation(operation: OfflineOperation): Promise<void> {
    const { type, endpoint, data } = operation;
    const url = `${environment.apiUrl}${endpoint}`;

    // Aggiungi headers di autenticazione se necessario
    const headers = this.getAuthHeaders();

    switch (type) {
      case 'CREATE':
        await this.http.post(url, data, { headers }).toPromise();
        break;
      case 'UPDATE':
        await this.http.put(url, data, { headers }).toPromise();
        break;
      case 'DELETE':
        await this.http.delete(url, { headers }).toPromise();
        break;
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  private getAuthHeaders(): any {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private sortOperationsByPriority(operations: OfflineOperation[]): OfflineOperation[] {
    const priorityOrder = { high: 0, normal: 1, low: 2 };

    return operations.sort((a, b) => {
      // Prima per priorità
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Poi per timestamp (FIFO)
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }

  async getOperationsByPriority(priority: 'high' | 'normal' | 'low'): Promise<OfflineOperation[]> {
    const operations = await this.offlineStorage.getPendingOperations();
    return operations.filter(op => op.priority === priority);
  }

  async getQueueStats(): Promise<QueueStats> {
    const operations = await this.offlineStorage.getPendingOperations();
    const completed = this.syncResults.filter(r => r.success).length;
    const failed = this.syncResults.filter(r => !r.success).length;

    const highPriority = operations.filter(op => op.priority === 'high').length;
    const normalPriority = operations.filter(op => op.priority === 'normal').length;
    const lowPriority = operations.filter(op => op.priority === 'low').length;

    const avgProcessingTime = this.calculateAverageProcessingTime();

    return {
      total_operations: operations.length + completed + failed,
      pending_operations: operations.length,
      completed_operations: completed,
      failed_operations: failed,
      high_priority: highPriority,
      normal_priority: normalPriority,
      low_priority: lowPriority,
      average_processing_time: avgProcessingTime,
      last_sync: new Date().toISOString()
    };
  }

  private calculateAverageProcessingTime(): number {
    if (this.syncResults.length === 0) return 0;

    const processingTimes = this.syncResults
      .filter(r => r.success)
      .map(r => new Date(r.timestamp).getTime());

    if (processingTimes.length === 0) return 0;

    const avg = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    return avg;
  }

  async cleanupCompletedOperations(): Promise<void> {
    // Mantieni solo gli ultimi 100 risultati
    if (this.syncResults.length > 100) {
      this.syncResults = this.syncResults.slice(-100);
    }
  }

  async getPendingOperations(): Promise<OfflineOperation[]> {
    return await this.offlineStorage.getPendingOperations();
  }

  getSyncResults(): SyncResult[] {
    return [...this.syncResults];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
} 