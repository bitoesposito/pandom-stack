import { Injectable } from '@angular/core';
import {
  OfflineUserData,
  OfflineOperation,
  SecurityLogEntry,
  DatabaseStats
} from '../models/offline.models';
import { NotificationService } from './notification.service';

/**
 * Offline Storage Service
 * 
 * Manages IndexedDB operations for offline data storage, providing a robust
 * local database solution for the application's offline functionality.
 * This service handles all data persistence operations including user data,
 * pending operations, and security logs.
 * 
 * Features:
 * - IndexedDB database management
 * - User data storage and retrieval
 * - Pending operations queue management
 * - Security log storage
 * - Database statistics and monitoring
 * - Data cleanup and maintenance
 * - Bulk operations support
 * 
 * Database Structure:
 * - users: User data with email and sync indexes
 * - pendingOperations: Sync queue with priority indexing
 * - securityLogs: Audit logs with user and timestamp indexes
 * 
 * Storage Capabilities:
 * - Structured data storage
 * - Indexed queries for performance
 * - Transaction-based operations
 * - Error handling and recovery
 * - Database versioning
 * - Automatic schema upgrades
 * 
 * Data Management:
 * - CRUD operations for all data types
 * - Bulk data operations
 * - Data integrity validation
 * - Storage size monitoring
 * - Cleanup and maintenance
 * 
 * Usage:
 * - Inject service in offline components
 * - Initialize database before use
 * - Store and retrieve user data
 * - Manage operation queues
 * - Handle security logging
 * - Monitor storage usage
 * 
 * @example
 * // Initialize database
 * await this.offlineStorageService.initializeDB();
 * 
 * @example
 * // Store user data
 * await this.offlineStorageService.storeUserData(userData);
 * 
 * @example
 * // Get user data
 * const data = await this.offlineStorageService.getUserData('user-id');
 * 
 * @example
 * // Get database statistics
 * const stats = await this.offlineStorageService.getDatabaseStats();
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  // ============================================================================
  // PROPERTIES
  // ============================================================================

  /**
   * IndexedDB database instance
   * 
   * Holds the reference to the IndexedDB database
   * for performing storage operations.
   */
  private db: IDBDatabase | null = null;

  /**
   * Database configuration constants
   * 
   * Defines database name, version, and other
   * configuration parameters.
   */
  private readonly DB_NAME = 'pandom-offline';
  private readonly DB_VERSION = 1;

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  constructor(private notification: NotificationService) {}

  // ============================================================================
  // DATABASE INITIALIZATION
  // ============================================================================

  /**
   * Initialize IndexedDB database
   * 
   * Creates or opens the IndexedDB database and sets up
   * the required object stores and indexes for offline storage.
   * 
   * @returns Promise<void>
   * 
   * @example
   * await this.offlineStorageService.initializeDB();
   * // Database is ready for use
   * 
   * Initialization process:
   * 1. Opens IndexedDB with specified name and version
   * 2. Creates object stores if they don't exist
   * 3. Sets up indexes for efficient queries
   * 4. Handles database upgrade scenarios
   * 5. Stores database reference
   * 
   * Database schema:
   * - users: User data with email and sync indexes
   * - pendingOperations: Sync queue with priority indexing
   * - securityLogs: Audit logs with user and timestamp indexes
   * 
   * Error handling:
   * - Database access errors
   * - Schema upgrade failures
   * - Storage quota exceeded
   * - Browser compatibility issues
   */
  async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        this.notification.handleError(request.error, 'Errore inizializzazione database offline');
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store for user data
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'uuid' });
          userStore.createIndex('email', 'email', { unique: true });
          userStore.createIndex('last_sync', 'last_sync', { unique: false });
        }

        // Store for pending operations
        if (!db.objectStoreNames.contains('pendingOperations')) {
          const operationStore = db.createObjectStore('pendingOperations', { keyPath: 'id' });
          operationStore.createIndex('timestamp', 'timestamp', { unique: false });
          operationStore.createIndex('priority', 'priority', { unique: false });
        }

        // Store for security logs
        if (!db.objectStoreNames.contains('securityLogs')) {
          const logStore = db.createObjectStore('securityLogs', { keyPath: 'id', autoIncrement: true });
          logStore.createIndex('userId', 'userId', { unique: false });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // ============================================================================
  // USER DATA OPERATIONS
  // ============================================================================

  /**
   * Store user data in IndexedDB
   * 
   * Saves or updates user data in the offline database.
   * Uses the user's UUID as the primary key.
   * 
   * @param userData - User data to store
   * @returns Promise<void>
   * 
   * @example
   * const userData = {
   *   uuid: 'user-123',
   *   user: { name: 'John', email: 'john@example.com' },
   *   profile: { bio: 'Developer' },
   *   last_sync: '2024-01-01T00:00:00Z'
   * };
   * await this.offlineStorageService.storeUserData(userData);
   * 
   * Storage process:
   * 1. Validates database initialization
   * 2. Creates read-write transaction
   * 3. Stores data using put operation
   * 4. Handles success and error cases
   * 5. Shows appropriate notifications
   * 
   * Data structure:
   * - uuid: Primary key for user identification
   * - user: Complete user information
   * - profile: User profile data
   * - security_logs: Security activity logs
   * - last_sync: Last synchronization timestamp
   * - created_at: Data creation timestamp
   * - updated_at: Last update timestamp
   */
  async storeUserData(userData: OfflineUserData): Promise<void> {
    if (!this.db) {
      this.notification.handleError('Database not initialized', 'Database non inizializzato');
      throw new Error('Database not initialized');
    }
    
    const transaction = this.db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    
    return new Promise((resolve, reject) => {
      const request = store.put(userData);
      
      request.onsuccess = () => {
        this.notification.handleSuccess('Dati utente salvati offline');
        resolve();
      };
      
      request.onerror = () => {
        this.notification.handleError(request.error, 'Errore salvataggio dati offline');
        reject(request.error);
      };
    });
  }

  /**
   * Get user data from IndexedDB
   * 
   * Retrieves user data from the offline database using
   * the user's UUID as the lookup key.
   * 
   * @param userId - User UUID to retrieve
   * @returns Promise<OfflineUserData | null> - User data or null if not found
   * 
   * @example
   * const userData = await this.offlineStorageService.getUserData('user-123');
   * if (userData) {
   *   console.log('User name:', userData.user.name);
   *   console.log('Last sync:', userData.last_sync);
   * }
   * 
   * Retrieval process:
   * 1. Validates database initialization
   * 2. Creates read-only transaction
   * 3. Retrieves data using get operation
   * 4. Returns data or null if not found
   * 5. Handles retrieval errors
   * 
   * Return values:
   * - OfflineUserData: Complete user data if found
   * - null: If user data doesn't exist
   * - Error: If database operation fails
   */
  async getUserData(userId: string): Promise<OfflineUserData | null> {
    if (!this.db) {
      this.notification.handleError('Database not initialized', 'Database non inizializzato');
      throw new Error('Database not initialized');
    }
    
    const transaction = this.db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    
    return new Promise((resolve, reject) => {
      const request = store.get(userId);
      
      request.onsuccess = () => {
        if (!request.result) {
          this.notification.handleWarning('Nessun dato offline trovato per questo utente');
        }
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        this.notification.handleError(request.error, 'Errore recupero dati offline');
        reject(request.error);
      };
    });
  }

  /**
   * Get all users data from IndexedDB
   * 
   * Retrieves all user data stored in the offline database.
   * Useful for administrative purposes and bulk operations.
   * 
   * @returns Promise<OfflineUserData[]> - Array of all user data
   * 
   * @example
   * const allUsers = await this.offlineStorageService.getAllUsers();
   * console.log('Total offline users:', allUsers.length);
   * allUsers.forEach(user => {
   *   console.log('User:', user.user.name, 'Last sync:', user.last_sync);
   * });
   * 
   * Bulk retrieval:
   * 1. Validates database initialization
   * 2. Creates read-only transaction
   * 3. Retrieves all records using getAll
   * 4. Returns array of user data
   * 5. Handles retrieval errors
   * 
   * Use cases:
   * - Administrative overview
   * - Bulk data operations
   * - System maintenance
   * - Data analysis and reporting
   */
  async getAllUsers(): Promise<OfflineUserData[]> {
    if (!this.db) {
      this.notification.handleError('Database not initialized', 'Database non inizializzato');
      throw new Error('Database not initialized');
    }
    
    const transaction = this.db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        this.notification.handleError(request.error, 'Errore recupero lista utenti offline');
        reject(request.error);
      };
    });
  }

  /**
   * Delete user data from IndexedDB
   * 
   * Removes user data from the offline database using
   * the user's UUID as the deletion key.
   * 
   * @param userId - User UUID to delete
   * @returns Promise<void>
   * 
   * @example
   * await this.offlineStorageService.deleteUserData('user-123');
   * // User data has been removed from offline storage
   * 
   * Deletion process:
   * 1. Validates database initialization
   * 2. Creates read-write transaction
   * 3. Deletes data using delete operation
   * 4. Handles success and error cases
   * 5. Shows appropriate notifications
   * 
   * Note: This operation is irreversible and will permanently
   * remove all offline data for the specified user.
   */
  async deleteUserData(userId: string): Promise<void> {
    if (!this.db) {
      this.notification.handleError('Database not initialized', 'Database non inizializzato');
      throw new Error('Database not initialized');
    }
    
    const transaction = this.db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(userId);
      
      request.onsuccess = () => {
        this.notification.handleSuccess('Dati utente offline eliminati');
        resolve();
      };
      
      request.onerror = () => {
        this.notification.handleError(request.error, 'Errore eliminazione dati offline');
        reject(request.error);
      };
    });
  }

  // ============================================================================
  // PENDING OPERATIONS MANAGEMENT
  // ============================================================================

  /**
   * Add pending operation to sync queue
   * 
   * Stores an operation in the pending operations queue
   * for later synchronization when connection is restored.
   * 
   * @param operation - Operation to queue
   * @returns Promise<void>
   * 
   * @example
   * const operation = {
   *   id: 'op-123',
   *   type: 'UPDATE',
   *   endpoint: '/profile',
   *   data: { name: 'John Doe' },
   *   priority: 'normal'
   * };
   * await this.offlineStorageService.addPendingOperation(operation);
   * 
   * Queue process:
   * 1. Validates database initialization
   * 2. Creates read-write transaction
   * 3. Adds operation to pendingOperations store
   * 4. Handles success and error cases
   * 5. Shows appropriate notifications
   * 
   * Operation structure:
   * - id: Unique operation identifier
   * - type: Operation type (CREATE, UPDATE, DELETE)
   * - endpoint: API endpoint for synchronization
   * - data: Operation payload
   * - priority: Operation priority (high, normal, low)
   * - retry_count: Current retry attempts
   * - max_retries: Maximum retry attempts
   * - retry_delay: Delay between retries
   */
  async addPendingOperation(operation: OfflineOperation): Promise<void> {
    if (!this.db) {
      this.notification.handleError('Database not initialized', 'Database non inizializzato');
      throw new Error('Database not initialized');
    }
    
    const transaction = this.db.transaction(['pendingOperations'], 'readwrite');
    const store = transaction.objectStore('pendingOperations');
    
    return new Promise((resolve, reject) => {
      const request = store.add(operation);
      
      request.onsuccess = () => {
        this.notification.handleSuccess('Operazione accodata offline');
        resolve();
      };
      
      request.onerror = () => {
        this.notification.handleError(request.error, 'Errore accodamento operazione offline');
        reject(request.error);
      };
    });
  }

  /**
   * Get all pending operations from sync queue
   * 
   * Retrieves all pending operations from the sync queue
   * for processing during synchronization.
   * 
   * @returns Promise<OfflineOperation[]> - Array of pending operations
   * 
   * @example
   * const pendingOps = await this.offlineStorageService.getPendingOperations();
   * console.log('Pending operations:', pendingOps.length);
   * pendingOps.forEach(op => {
   *   console.log('Operation:', op.type, 'Endpoint:', op.endpoint);
   * });
   * 
   * Retrieval process:
   * 1. Validates database initialization
   * 2. Creates read-only transaction
   * 3. Retrieves all pending operations
   * 4. Returns array of operations
   * 5. Handles retrieval errors
   * 
   * Use cases:
   * - Synchronization processing
   * - Queue monitoring
   * - Operation prioritization
   * - Error handling and retries
   */
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

  /**
   * Get operations by priority level
   * 
   * Retrieves pending operations filtered by priority level
   * for prioritized synchronization processing.
   * 
   * @param priority - Priority level to filter by
   * @returns Promise<OfflineOperation[]> - Array of operations with specified priority
   * 
   * @example
   * const highPriorityOps = await this.offlineStorageService.getOperationsByPriority('high');
   * const normalOps = await this.offlineStorageService.getOperationsByPriority('normal');
   * 
   * Priority levels:
   * - high: Critical operations that should be processed first
   * - normal: Standard operations with normal priority
   * - low: Low priority operations processed last
   * 
   * Filtering process:
   * 1. Validates database initialization
   * 2. Creates read-only transaction
   * 3. Uses priority index for filtering
   * 4. Returns filtered operations
   * 5. Handles filtering errors
   */
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

  /**
   * Remove pending operation from sync queue
   * 
   * Removes a specific operation from the pending operations
   * queue, typically after successful synchronization.
   * 
   * @param operationId - ID of operation to remove
   * @returns Promise<void>
   * 
   * @example
   * await this.offlineStorageService.removePendingOperation('op-123');
   * // Operation has been removed from the queue
   * 
   * Removal process:
   * 1. Validates database initialization
   * 2. Creates read-write transaction
   * 3. Removes operation using delete operation
   * 4. Handles success and error cases
   * 5. Shows appropriate notifications
   * 
   * Use cases:
   * - Successful operation completion
   * - Failed operation cleanup
   * - Queue maintenance
   * - Manual operation removal
   */
  async removePendingOperation(operationId: string): Promise<void> {
    if (!this.db) {
      this.notification.handleError('Database not initialized', 'Database non inizializzato');
      throw new Error('Database not initialized');
    }
    
    const transaction = this.db.transaction(['pendingOperations'], 'readwrite');
    const store = transaction.objectStore('pendingOperations');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(operationId);
      
      request.onsuccess = () => {
        this.notification.handleSuccess('Operazione offline rimossa dalla coda');
        resolve();
      };
      
      request.onerror = () => {
        this.notification.handleError(request.error, 'Errore rimozione operazione offline');
        reject(request.error);
      };
    });
  }

  /**
   * Update pending operation in sync queue
   * 
   * Updates an existing operation in the pending operations
   * queue, typically to update retry counts or status.
   * 
   * @param operation - Updated operation data
   * @returns Promise<void>
   * 
   * @example
   * const updatedOp = { ...operation, retry_count: operation.retry_count + 1 };
   * await this.offlineStorageService.updatePendingOperation(updatedOp);
   * 
   * Update process:
   * 1. Validates database initialization
   * 2. Creates read-write transaction
   * 3. Updates operation using put operation
   * 4. Handles success and error cases
   * 5. Maintains operation integrity
   * 
   * Common updates:
   * - Increment retry count
   * - Update operation status
   * - Modify operation data
   * - Update timestamps
   */
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

  // ============================================================================
  // SECURITY LOGGING
  // ============================================================================

  /**
   * Add security log entry
   * 
   * Stores a security log entry in the offline database
   * for audit and monitoring purposes.
   * 
   * @param log - Security log entry to store
   * @returns Promise<void>
   * 
   * @example
   * const logEntry = {
   *   userId: 'user-123',
   *   event_type: 'data_access',
   *   timestamp: new Date().toISOString(),
   *   details: { action: 'read', dataType: 'profile' }
   * };
   * await this.offlineStorageService.addSecurityLog(logEntry);
   * 
   * Logging process:
   * 1. Validates database initialization
   * 2. Creates read-write transaction
   * 3. Adds log entry with auto-increment ID
   * 4. Handles success and error cases
   * 5. Shows appropriate notifications
   * 
   * Log entry structure:
   * - id: Auto-increment primary key
   * - userId: User who performed the action
   * - event_type: Type of security event
   * - timestamp: When the event occurred
   * - details: Additional event information
   * - source: Event source (offline/online)
   * - session_id: Session identifier
   * - ip_address: IP address (offline for offline events)
   * - user_agent: Browser user agent
   */
  async addSecurityLog(log: Omit<SecurityLogEntry, 'id'>): Promise<void> {
    if (!this.db) {
      this.notification.handleError('Database not initialized', 'Database non inizializzato');
      throw new Error('Database not initialized');
    }
    
    const transaction = this.db.transaction(['securityLogs'], 'readwrite');
    const store = transaction.objectStore('securityLogs');
    
    return new Promise((resolve, reject) => {
      const request = store.add(log);
      
      request.onsuccess = () => {
        this.notification.handleSuccess('Log di sicurezza aggiunto offline');
        resolve();
      };
      
      request.onerror = () => {
        this.notification.handleError(request.error, 'Errore aggiunta log di sicurezza offline');
        reject(request.error);
      };
    });
  }

  /**
   * Get security logs for specific user
   * 
   * Retrieves security log entries for a specific user
   * from the offline database.
   * 
   * @param userId - User ID to get logs for
   * @returns Promise<SecurityLogEntry[]> - Array of security log entries
   * 
   * @example
   * const userLogs = await this.offlineStorageService.getSecurityLogs('user-123');
   * userLogs.forEach(log => {
   *   console.log('Event:', log.event_type, 'at', log.timestamp);
   *   console.log('Details:', log.details);
   * });
   * 
   * Retrieval process:
   * 1. Validates database initialization
   * 2. Creates read-only transaction
   * 3. Uses userId index for filtering
   * 4. Returns filtered log entries
   * 5. Handles retrieval errors
   * 
   * Use cases:
   * - User activity monitoring
   * - Security audit trails
   * - Compliance reporting
   * - Incident investigation
   */
  async getSecurityLogs(userId: string): Promise<SecurityLogEntry[]> {
    if (!this.db) {
      this.notification.handleError('Database not initialized', 'Database non inizializzato');
      throw new Error('Database not initialized');
    }
    
    const transaction = this.db.transaction(['securityLogs'], 'readonly');
    const store = transaction.objectStore('securityLogs');
    const index = store.index('userId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(userId);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        this.notification.handleError(request.error, 'Errore recupero log di sicurezza offline');
        reject(request.error);
      };
    });
  }

  /**
   * Get all security logs
   * 
   * Retrieves all security log entries from the offline database.
   * Useful for system-wide security monitoring and analysis.
   * 
   * @returns Promise<SecurityLogEntry[]> - Array of all security log entries
   * 
   * @example
   * const allLogs = await this.offlineStorageService.getAllSecurityLogs();
   * console.log('Total security logs:', allLogs.length);
   * 
   * Bulk retrieval:
   * 1. Validates database initialization
   * 2. Creates read-only transaction
   * 3. Retrieves all log entries
   * 4. Returns complete log array
   * 5. Handles retrieval errors
   * 
   * Use cases:
   * - System-wide security monitoring
   * - Security analysis and reporting
   * - Compliance audits
   * - Incident response
   */
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

  // ============================================================================
  // DATABASE MAINTENANCE
  // ============================================================================

  /**
   * Clean up old data
   * 
   * Removes old security log entries based on maximum age
   * to prevent database bloat and maintain performance.
   * 
   * @param maxAge - Maximum age in days for data retention
   * @returns Promise<void>
   * 
   * @example
   * // Remove logs older than 30 days
   * await this.offlineStorageService.cleanupOldData(30);
   * 
   * Cleanup process:
   * 1. Validates database initialization
   * 2. Calculates cutoff date based on maxAge
   * 3. Creates read-write transaction
   * 4. Uses timestamp index for efficient filtering
   * 5. Removes old entries using cursor
   * 6. Handles cleanup errors
   * 
   * Performance benefits:
   * - Reduces database size
   * - Improves query performance
   * - Maintains storage efficiency
   * - Prevents storage quota issues
   */
  async cleanupOldData(maxAge: number): Promise<void> {
    if (!this.db) {
      this.notification.handleError('Database not initialized', 'Database non inizializzato');
      throw new Error('Database not initialized');
    }
    
    const cutoffDate = new Date(Date.now() - (maxAge * 24 * 60 * 60 * 1000)).toISOString();
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
          this.notification.handleSuccess('Dati obsoleti puliti offline');
          resolve();
        }
      };
      
      request.onerror = () => {
        this.notification.handleError(request.error, 'Errore pulizia dati obsoleti offline');
        reject(request.error);
      };
    });
  }

  /**
   * Get database statistics
   * 
   * Retrieves comprehensive statistics about the offline database
   * including record counts, storage size, and maintenance information.
   * 
   * @returns Promise<DatabaseStats> - Database statistics
   * 
   * @example
   * const stats = await this.offlineStorageService.getDatabaseStats();
   * console.log('Total users:', stats.total_users);
   * console.log('Pending operations:', stats.total_operations);
   * console.log('Security logs:', stats.total_logs);
   * console.log('Storage size:', stats.storage_size, 'bytes');
   * 
   * Statistics include:
   * - total_users: Number of stored user records
   * - total_operations: Number of pending operations
   * - total_logs: Number of security log entries
   * - storage_size: Approximate storage size in bytes
   * - last_cleanup: Timestamp of last cleanup operation
   * 
   * Use cases:
   * - Database monitoring
   * - Performance analysis
   * - Storage management
   * - Maintenance scheduling
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    if (!this.db) throw new Error('Database not initialized');
    
    const [users, operations, logs] = await Promise.all([
      this.getAllUsers(),
      this.getPendingOperations(),
      this.getAllSecurityLogs()
    ]);

    // Calculate approximate storage size
    const storageSize = JSON.stringify({ users, operations, logs }).length;

    return {
      total_users: users.length,
      total_operations: operations.length,
      total_logs: logs.length,
      storage_size: storageSize,
      last_cleanup: new Date().toISOString()
    };
  }

  /**
   * Clear all data from database
   * 
   * Removes all data from all object stores in the offline database.
   * This operation is irreversible and should be used with caution.
   * 
   * @returns Promise<void>
   * 
   * @example
   * await this.offlineStorageService.clearAllData();
   * // All offline data has been cleared
   * 
   * Clear process:
   * 1. Validates database initialization
   * 2. Iterates through all object stores
   * 3. Clears each store using clear operation
   * 4. Handles success and error cases
   * 5. Shows appropriate notifications
   * 
   * Warning: This operation permanently removes all offline data
   * including user data, pending operations, and security logs.
   * Use only when absolutely necessary.
   */
  async clearAllData(): Promise<void> {
    if (!this.db) {
      this.notification.handleError('Database not initialized', 'Database non inizializzato');
      throw new Error('Database not initialized');
    }
    
    const stores = ['users', 'pendingOperations', 'securityLogs'];
    
    try {
      for (const storeName of stores) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        await new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      this.notification.handleSuccess('Tutti i dati offline sono stati cancellati');
    } catch (error) {
      this.notification.handleError(error, 'Errore durante la cancellazione dei dati offline');
      throw error;
    }
  }

  /**
   * Close database connection
   * 
   * Properly closes the IndexedDB database connection
   * and cleans up resources.
   * 
   * @returns Promise<void>
   * 
   * @example
   * await this.offlineStorageService.closeDatabase();
   * // Database connection closed
   * 
   * Cleanup process:
   * 1. Checks if database is open
   * 2. Closes database connection
   * 3. Nullifies database reference
   * 4. Shows information notification
   * 
   * Use cases:
   * - Application shutdown
   * - Memory cleanup
   * - Resource management
   * - Database maintenance
   */
  async closeDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.notification.handleInfo('Database offline chiuso');
    }
  }
} 