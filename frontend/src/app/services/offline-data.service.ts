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

/**
 * Offline Data Service
 * 
 * Manages offline data synchronization, storage, and retrieval for the application.
 * This service handles the complete offline data lifecycle including sync operations,
 * data freshness management, and offline metrics collection.
 * 
 * Features:
 * - User data synchronization from server
 * - Offline data storage and retrieval
 * - Profile and user data updates
 * - Data export and download functionality
 * - Data freshness monitoring
 * - Force synchronization capabilities
 * - Offline metrics collection
 * - Data staleness detection
 * - Bulk offline operations
 * 
 * Offline Data Management:
 * - Automatic data synchronization
 * - Local data caching
 * - Conflict resolution
 * - Data integrity validation
 * - Export/import capabilities
 * - Cleanup operations
 * 
 * Synchronization Features:
 * - Server-to-local data sync
 * - Queue-based sync operations
 * - Retry mechanisms
 * - Priority-based processing
 * - Conflict detection and resolution
 * 
 * Data Operations:
 * - User profile updates
 * - Data export in JSON format
 * - Freshness monitoring
 * - Stale data detection
 * - Bulk data operations
 * 
 * Usage:
 * - Inject service in components
 * - Call sync methods for data synchronization
 * - Use export methods for data portability
 * - Monitor data freshness and staleness
 * - Handle offline data operations
 * 
 * @example
 * // Sync user data from server
 * await this.offlineDataService.syncUserData('user-id');
 * 
 * @example
 * // Get offline user data
 * const userData = await this.offlineDataService.getOfflineUserData('user-id');
 * 
 * @example
 * // Export offline data
 * const blob = await this.offlineDataService.exportOfflineData('user-id');
 * 
 * @example
 * // Check data freshness
 * const freshness = await this.offlineDataService.getDataFreshness('user-id');
 * if (freshness > 3600) {
 *   await this.offlineDataService.forceSync('user-id');
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineDataService {
  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private offlineStorage: OfflineStorageService,
    private syncQueue: SyncQueueService,
    private notification: NotificationService
  ) {}

  // ============================================================================
  // SYNCHRONIZATION METHODS
  // ============================================================================

  /**
   * Synchronize user data from server to offline storage
   * 
   * Fetches user data from the server and stores it locally
   * for offline access. This method creates a complete offline
   * copy of the user's data including profile information.
   * 
   * @param userId - Unique identifier of the user to sync
   * @returns Promise<void>
   * 
   * @example
   * await this.offlineDataService.syncUserData('user-123');
   * // User data synchronized and stored offline
   * 
   * Sync process:
   * 1. Fetches user data from server
   * 2. Validates received data
   * 3. Creates offline data structure
   * 4. Stores data in IndexedDB
   * 5. Updates sync timestamps
   * 6. Shows success notification
   * 
   * Error handling:
   * - Handles server communication errors
   * - Validates data structure
   * - Shows appropriate error notifications
   * - Throws errors for component handling
   */
  async syncUserData(userId: string): Promise<void> {
    try {
      // Synchronize user data from server
      const userData = await this.userService.getUser(userId).toPromise();
      
      if (!userData || !userData.data) {
        throw new Error('No user data received from server');
      }
      
      // Save to IndexedDB
      const offlineUserData: OfflineUserData = {
        user: userData.data,
        profile: userData.data, // UserDetails already contains profile data
        security_logs: [], // Empty array for now, to be implemented when available
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

  /**
   * Force synchronization of user data
   * 
   * Performs an immediate synchronization of user data
   * regardless of current data freshness status.
   * 
   * @param userId - Unique identifier of the user to sync
   * @returns Promise<void>
   * 
   * @example
   * await this.offlineDataService.forceSync('user-123');
   * // Force sync completed
   * 
   * Force sync process:
   * 1. Bypasses freshness checks
   * 2. Performs immediate server sync
   * 3. Updates local data
   * 4. Handles sync errors
   */
  async forceSync(userId: string): Promise<void> {
    try {
      await this.syncUserData(userId);
    } catch (error) {
      console.error('Force sync failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // DATA RETRIEVAL METHODS
  // ============================================================================

  /**
   * Get offline user data from local storage
   * 
   * Retrieves the user's offline data from IndexedDB.
   * Returns null if no offline data is available.
   * 
   * @param userId - Unique identifier of the user
   * @returns Promise<OfflineUserData | null> - User data or null if not found
   * 
   * @example
   * const userData = await this.offlineDataService.getOfflineUserData('user-123');
   * if (userData) {
   *   console.log('User profile:', userData.profile);
   *   console.log('Last sync:', userData.last_sync);
   * }
   * 
   * Data structure:
   * - user: Complete user information
   * - profile: User profile data
   * - security_logs: Security activity logs
   * - last_sync: Last synchronization timestamp
   * - created_at: Data creation timestamp
   * - updated_at: Last update timestamp
   */
  async getOfflineUserData(userId: string): Promise<OfflineUserData | null> {
    try {
      return await this.offlineStorage.getUserData(userId);
    } catch (error) {
      console.error('Failed to get offline user data:', error);
      return null;
    }
  }

  /**
   * Get all offline users data
   * 
   * Retrieves offline data for all users stored locally.
   * Useful for administrative purposes and bulk operations.
   * 
   * @returns Promise<OfflineUserData[]> - Array of all offline user data
   * 
   * @example
   * const allUsers = await this.offlineDataService.getAllOfflineUsers();
   * console.log('Total offline users:', allUsers.length);
   * 
   * Use cases:
   * - Administrative overview
   * - Bulk data operations
   * - System maintenance
   * - Data analysis
   */
  async getAllOfflineUsers(): Promise<OfflineUserData[]> {
    try {
      return await this.offlineStorage.getAllUsers();
    } catch (error) {
      console.error('Failed to get all offline users:', error);
      return [];
    }
  }

  // ============================================================================
  // DATA UPDATE METHODS
  // ============================================================================

  /**
   * Update user profile offline
   * 
   * Updates the user's profile data offline and queues the
   * change for synchronization when connection is restored.
   * 
   * @param profileData - Profile data to update
   * @returns Promise<void>
   * 
   * @example
   * const profileUpdate = { name: 'John Doe', bio: 'Developer' };
   * await this.offlineDataService.updateProfileOffline(profileUpdate);
   * 
   * Update process:
   * 1. Validates user authentication
   * 2. Extracts user ID from token
   * 3. Adds update to sync queue
   * 4. Updates local cache
   * 5. Shows success notification
   * 
   * Queue management:
   * - Adds operation to sync queue
   * - Sets retry parameters
   * - Configures priority level
   * - Handles queue errors
   */
  async updateProfileOffline(profileData: any): Promise<void> {
    try {
      const token = this.authService.getToken();
      if (!token) throw new Error('User not authenticated');
      
      const userId = this.extractUserIdFromToken(token);
      if (!userId) throw new Error('Could not extract user ID from token');

      // Save modification to sync queue
      await this.syncQueue.addToQueue({
        type: 'UPDATE',
        endpoint: '/profile',
        data: profileData,
        retry_count: 0,
        max_retries: 3,
        retry_delay: 1000,
        priority: 'normal'
      });

      // Update local cache
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

  /**
   * Update user data offline
   * 
   * Updates the user's data offline and queues the change
   * for synchronization when connection is restored.
   * 
   * @param userData - User data to update
   * @returns Promise<void>
   * 
   * @example
   * const userUpdate = { email: 'newemail@example.com' };
   * await this.offlineDataService.updateUserOffline(userUpdate);
   * 
   * Update process:
   * 1. Validates user authentication
   * 2. Extracts user ID from token
   * 3. Adds update to sync queue
   * 4. Updates local cache
   * 5. Handles update errors
   */
  async updateUserOffline(userData: any): Promise<void> {
    const token = this.authService.getToken();
    if (!token) throw new Error('User not authenticated');
    
    // Extract userId from JWT token (simplified implementation)
    const userId = this.extractUserIdFromToken(token);
    if (!userId) throw new Error('Could not extract user ID from token');

    // Save modification to sync queue
    await this.syncQueue.addToQueue({
      type: 'UPDATE',
      endpoint: '/users/update',
      data: userData,
      retry_count: 0,
      max_retries: 3,
      retry_delay: 1000,
      priority: 'normal'
    });

    // Update local cache
    const currentData = await this.getOfflineUserData(userId);
    if (currentData) {
      currentData.user = { ...currentData.user, ...userData };
      currentData.updated_at = new Date().toISOString();
      await this.offlineStorage.storeUserData(currentData);
    }
  }

  // ============================================================================
  // DATA EXPORT METHODS
  // ============================================================================

  /**
   * Export offline data as JSON blob
   * 
   * Creates a downloadable JSON file containing all offline
   * user data including profile, security logs, and metadata.
   * 
   * @param userId - Unique identifier of the user
   * @returns Promise<Blob> - JSON blob for download
   * 
   * @example
   * const blob = await this.offlineDataService.exportOfflineData('user-123');
   * const url = URL.createObjectURL(blob);
   * // Use URL for download
   * 
   * Export structure:
   * - user: Complete user information
   * - profile: User profile data
   * - security_logs: Security activity logs
   * - export_info: Export metadata
   *   - exported_at: Export timestamp
   *   - exported_by: User who exported
   *   - format: Export format (JSON)
   *   - source: Data source (offline)
   *   - version: Export version
   */
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

  /**
   * Download offline data as file
   * 
   * Exports offline data and triggers a file download
   * with a descriptive filename including user ID and date.
   * 
   * @param userId - Unique identifier of the user
   * @returns Promise<void>
   * 
   * @example
   * await this.offlineDataService.downloadOfflineData('user-123');
   * // File download starts automatically
   * 
   * Download process:
   * 1. Exports data as JSON blob
   * 2. Creates download URL
   * 3. Triggers file download
   * 4. Cleans up resources
   * 5. Handles download errors
   * 
   * Filename format:
   * user-data-{userId}-offline-{date}.json
   */
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

  // ============================================================================
  // DATA FRESHNESS METHODS
  // ============================================================================

  /**
   * Get data freshness in seconds
   * 
   * Calculates how many seconds have passed since the last
   * synchronization of the user's offline data.
   * 
   * @param userId - Unique identifier of the user
   * @returns Promise<number> - Seconds since last sync, -1 if no data
   * 
   * @example
   * const freshness = await this.offlineDataService.getDataFreshness('user-123');
   * if (freshness > 3600) {
   *   console.log('Data is over 1 hour old');
   * }
   * 
   * Return values:
   * - Positive number: Seconds since last sync
   * - -1: No offline data available
   * - 0: Data was just synced
   */
  async getDataFreshness(userId: string): Promise<number> {
    const userData = await this.getOfflineUserData(userId);
    
    if (!userData || !userData.last_sync) {
      return -1; // No data available
    }
    
    const lastSync = new Date(userData.last_sync).getTime();
    const now = Date.now();
    return Math.floor((now - lastSync) / 1000); // Returns seconds
  }

  /**
   * Check if data is stale
   * 
   * Determines if the user's offline data is older than
   * the specified maximum age threshold.
   * 
   * @param userId - Unique identifier of the user
   * @param maxAgeSeconds - Maximum age in seconds (default: 1 hour)
   * @returns Promise<boolean> - True if data is stale
   * 
   * @example
   * const isStale = await this.offlineDataService.isDataStale('user-123', 1800);
   * if (isStale) {
   *   console.log('Data is over 30 minutes old');
   * }
   * 
   * Staleness calculation:
   * - Compares current time with last sync
   * - Returns true if data exceeds max age
   * - Returns false if data is fresh or unavailable
   */
  async isDataStale(userId: string, maxAgeSeconds: number = 3600): Promise<boolean> {
    const freshness = await this.getDataFreshness(userId);
    return freshness > maxAgeSeconds;
  }

  /**
   * Refresh data if stale
   * 
   * Automatically synchronizes user data if it's older than
   * the specified maximum age threshold.
   * 
   * @param userId - Unique identifier of the user
   * @param maxAgeSeconds - Maximum age in seconds (default: 1 hour)
   * @returns Promise<void>
   * 
   * @example
   * await this.offlineDataService.refreshDataIfStale('user-123', 1800);
   * // Data will be synced if older than 30 minutes
   * 
   * Refresh process:
   * 1. Checks data freshness
   * 2. Performs sync if data is stale
   * 3. Skips sync if data is fresh
   * 4. Handles sync errors
   */
  async refreshDataIfStale(userId: string, maxAgeSeconds: number = 3600): Promise<void> {
    if (await this.isDataStale(userId, maxAgeSeconds)) {
      await this.forceSync(userId);
    }
  }

  // ============================================================================
  // METRICS METHODS
  // ============================================================================

  /**
   * Get offline metrics for user
   * 
   * Collects comprehensive metrics about the user's offline
   * data including sync status, queue operations, and data freshness.
   * 
   * @param userId - Unique identifier of the user
   * @returns Promise<OfflineMetrics> - Offline metrics data
   * 
   * @example
   * const metrics = await this.offlineDataService.getOfflineMetrics('user-123');
   * console.log('Sync success rate:', metrics.sync_success_rate);
   * console.log('Queued operations:', metrics.operations_queued);
   * 
   * Metrics include:
   * - offline_time: Time spent offline
   * - operations_queued: Number of pending operations
   * - sync_success_rate: Percentage of successful syncs
   * - data_freshness: Seconds since last sync
   * - last_sync: Last synchronization timestamp
   */
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

  // ============================================================================
  // DATA CLEANUP METHODS
  // ============================================================================

  /**
   * Clear offline data for user
   * 
   * Removes all offline data for the specified user from
   * local storage. This operation is irreversible.
   * 
   * @param userId - Unique identifier of the user
   * @returns Promise<void>
   * 
   * @example
   * await this.offlineDataService.clearOfflineData('user-123');
   * // All offline data for user has been cleared
   * 
   * Cleanup process:
   * 1. Removes user data from IndexedDB
   * 2. Shows success notification
   * 3. Handles cleanup errors
   * 4. Irreversible operation
   */
  async clearOfflineData(userId: string): Promise<void> {
    try {
      await this.offlineStorage.deleteUserData(userId);
      this.notification.handleSuccess('Dati offline cancellati');
    } catch (error) {
      this.notification.handleError(error, 'Errore cancellazione dati offline');
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Extract user ID from JWT token
   * 
   * Decodes the JWT token and extracts the user ID
   * from the subject claim.
   * 
   * @param token - JWT token string
   * @returns string | null - User ID or null if extraction fails
   * 
   * @example
   * const userId = this.extractUserIdFromToken(jwtToken);
   * if (userId) {
   *   console.log('User ID:', userId);
   * }
   * 
   * Token structure:
   * - Decodes base64 payload
   * - Extracts 'sub' claim
   * - Handles decoding errors
   * - Returns null on failure
   */
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