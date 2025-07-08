import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { OfflineStorageService } from './offline-storage.service';
import { SyncQueueService } from './sync-queue.service';
import {
  OfflineUserData,
  OfflineMetrics
} from '../models/offline.models';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class OfflineDataService {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private offlineStorage: OfflineStorageService,
    private syncQueue: SyncQueueService,
    private notification: NotificationService
  ) {}

  async syncUserData(userId: string): Promise<void> {
    try {
      // Sincronizza dati utente dal server
      const userData = await this.userService.getUser(userId).toPromise();
      
      if (!userData || !userData.data) {
        throw new Error('No user data received from server');
      }
      
      // Salva in IndexedDB
      const offlineUserData: OfflineUserData = {
        user: userData.data,
        profile: userData.data, // UserDetails contiene già i dati del profilo
        security_logs: [], // Per ora array vuoto, da implementare quando disponibile
        last_sync: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await this.offlineStorage.storeUserData(offlineUserData);
      this.notification.handleSuccess('Dati utente sincronizzati offline');
    } catch (error) {
      this.notification.handleError(error, 'Errore durante la sincronizzazione dei dati utente offline');
      throw error;
    }
  }

  async getOfflineUserData(userId: string): Promise<OfflineUserData | null> {
    try {
      return await this.offlineStorage.getUserData(userId);
    } catch (error) {
      console.error('Failed to get offline user data:', error);
      return null;
    }
  }

  async updateProfileOffline(profileData: any): Promise<void> {
    try {
      const token = this.authService.getToken();
      if (!token) throw new Error('User not authenticated');
      const userId = this.extractUserIdFromToken(token);
      if (!userId) throw new Error('Could not extract user ID from token');

      // Salva modifica in coda sync
      await this.syncQueue.addToQueue({
        type: 'UPDATE',
        endpoint: '/profile',
        data: profileData,
        retry_count: 0,
        max_retries: 3,
        retry_delay: 1000,
        priority: 'normal'
      });

      // Aggiorna cache locale
      const currentData = await this.getOfflineUserData(userId);
      if (currentData) {
        currentData.profile = { ...currentData.profile, ...profileData };
        currentData.updated_at = new Date().toISOString();
        await this.offlineStorage.storeUserData(currentData);
        this.notification.handleSuccess('Profilo aggiornato offline');
      }
    } catch (error) {
      this.notification.handleError(error, 'Errore aggiornamento profilo offline');
      throw error;
    }
  }

  async updateUserOffline(userData: any): Promise<void> {
    const token = this.authService.getToken();
    if (!token) throw new Error('User not authenticated');
    
    // Estrai userId dal token JWT (implementazione semplificata)
    const userId = this.extractUserIdFromToken(token);
    if (!userId) throw new Error('Could not extract user ID from token');

    // Salva modifica in coda sync
    await this.syncQueue.addToQueue({
      type: 'UPDATE',
      endpoint: '/users/update',
      data: userData,
      retry_count: 0,
      max_retries: 3,
      retry_delay: 1000,
      priority: 'normal'
    });

    // Aggiorna cache locale
    const currentData = await this.getOfflineUserData(userId);
    if (currentData) {
      currentData.user = { ...currentData.user, ...userData };
      currentData.updated_at = new Date().toISOString();
      await this.offlineStorage.storeUserData(currentData);
    }
  }

  async exportOfflineData(userId: string): Promise<Blob> {
    try {
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
          source: 'offline',
          version: '1.0'
        }
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      this.notification.handleSuccess('Dati esportati offline');
      return new Blob([jsonString], { type: 'application/json' });
    } catch (error) {
      this.notification.handleError(error, 'Errore export dati offline');
      throw error;
    }
  }

  async downloadOfflineData(userId: string): Promise<void> {
    try {
      const blob = await this.exportOfflineData(userId);
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${userId}-offline-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download offline data:', error);
      throw error;
    }
  }

  async getDataFreshness(userId: string): Promise<number> {
    const userData = await this.getOfflineUserData(userId);
    
    if (!userData || !userData.last_sync) {
      return -1; // Nessun dato disponibile
    }
    
    const lastSync = new Date(userData.last_sync).getTime();
    const now = Date.now();
    return Math.floor((now - lastSync) / 1000); // Ritorna secondi
  }

  async forceSync(userId: string): Promise<void> {
    try {
      await this.syncUserData(userId);
    } catch (error) {
      console.error('Force sync failed:', error);
      throw error;
    }
  }

  async getOfflineMetrics(userId: string): Promise<OfflineMetrics> {
    try {
      const stats = await this.offlineStorage.getDatabaseStats();
      if (!stats) {
        throw new Error('No offline metrics available');
      }
    const pendingOperations = await this.syncQueue.getPendingOperations();
    const syncResults = this.syncQueue.getSyncResults();
    const successRate = syncResults.length > 0 ? 
      (syncResults.filter(r => r.success).length / syncResults.length) * 100 : 100;
    return {
        offline_time: 0, // Placeholder, calculate if needed
      operations_queued: pendingOperations.length,
      sync_success_rate: successRate,
        data_freshness: await this.getDataFreshness(userId),
      last_sync: new Date().toISOString()
    };
    } catch (error) {
      this.notification.handleError(error, 'Errore ottenimento metriche offline');
      throw error;
    }
  }

  async isDataStale(userId: string, maxAgeSeconds: number = 3600): Promise<boolean> {
    const freshness = await this.getDataFreshness(userId);
    return freshness > maxAgeSeconds;
  }

  async refreshDataIfStale(userId: string, maxAgeSeconds: number = 3600): Promise<void> {
    if (await this.isDataStale(userId, maxAgeSeconds)) {
      await this.forceSync(userId);
    }
  }

  async clearOfflineData(userId: string): Promise<void> {
    try {
      await this.offlineStorage.deleteUserData(userId);
      this.notification.handleSuccess('Dati offline cancellati');
    } catch (error) {
      this.notification.handleError(error, 'Errore cancellazione dati offline');
      throw error;
    }
  }

  async getAllOfflineUsers(): Promise<OfflineUserData[]> {
    try {
      return await this.offlineStorage.getAllUsers();
    } catch (error) {
      console.error('Failed to get all offline users:', error);
      return [];
    }
  }

  private extractUserIdFromToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || null;
    } catch (error) {
      console.error('Failed to extract user ID from token:', error);
      return null;
    }
  }
} 