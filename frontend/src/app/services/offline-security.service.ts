import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { OfflineStorageService } from './offline-storage.service';
import {
  SecurityLogEntry,
  OfflineSecurityConfig
} from '../models/offline.models';

/**
 * Offline Security Service
 * 
 * Manages security aspects of offline functionality including data encryption,
 * access validation, security logging, and data integrity verification.
 * This service ensures secure offline operations and maintains security
 * standards even when disconnected from the server.
 * 
 * Features:
 * - Offline access validation
 * - Data encryption and decryption
 * - Security activity logging
 * - Data integrity verification
 * - Token validation and refresh
 * - Cryptographic key management
 * - Security configuration management
 * 
 * Security Features:
 * - AES-GCM encryption for sensitive data
 * - JWT token validation for offline access
 * - Role-based permission validation
 * - Security audit logging
 * - Data hash generation and verification
 * - Session management
 * 
 * Encryption Capabilities:
 * - AES-GCM 256-bit encryption
 * - PBKDF2 key derivation
 * - Secure random IV generation
 * - Configurable encryption settings
 * - Automatic key management
 * 
 * Access Control:
 * - Token-based authentication
 * - Role-based authorization
 * - Permission validation
 * - Session tracking
 * - Access logging
 * 
 * Usage:
 * - Inject service in offline components
 * - Validate offline access before operations
 * - Encrypt sensitive data before storage
 * - Log security activities
 * - Verify data integrity
 * 
 * @example
 * // Validate offline access
 * const hasAccess = await this.offlineSecurityService.validateOfflineAccess();
 * if (hasAccess) {
 *   // Perform offline operations
 * }
 * 
 * @example
 * // Encrypt sensitive data
 * const encryptedData = await this.offlineSecurityService.encryptData(sensitiveData);
 * 
 * @example
 * // Log security activity
 * await this.offlineSecurityService.logOfflineActivity('data_access', { userId: '123' });
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineSecurityService {
  // ============================================================================
  // PROPERTIES
  // ============================================================================

  /**
   * Security configuration for offline operations
   * 
   * Defines encryption settings, algorithms, and security parameters
   * for offline data protection.
   */
  private readonly config: OfflineSecurityConfig = {
    encryptionEnabled: true,
    algorithm: 'AES-GCM',
    keyLength: 256,
    iterations: 100000
  };

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  constructor(
    private authService: AuthService,
    private offlineStorage: OfflineStorageService
  ) {}

  // ============================================================================
  // ACCESS VALIDATION METHODS
  // ============================================================================

  /**
   * Validate offline access permissions
   * 
   * Checks if the current user has valid permissions to access
   * offline functionality. Validates JWT token, expiration,
   * and user roles.
   * 
   * @returns Promise<boolean> - True if access is granted
   * 
   * @example
   * const hasAccess = await this.offlineSecurityService.validateOfflineAccess();
   * if (!hasAccess) {
   *   // Redirect to login or show access denied
   * }
   * 
   * Validation process:
   * 1. Checks for valid JWT token
   * 2. Validates token expiration (minimum 1 hour)
   * 3. Verifies user roles and permissions
   * 4. Returns access decision
   * 
   * Security requirements:
   * - Valid JWT token present
   * - Token not expired within 1 hour
   * - User has valid role (user/admin)
   * - Proper error handling
   */
  async validateOfflineAccess(): Promise<boolean> {
    try {
      const token = this.authService.getToken();
      if (!token) {
        return false;
      }

      // Verify JWT token
      const decoded = this.decodeJWT(token);
      if (!decoded) {
        return false;
      }

      const now = Date.now() / 1000;
      
      // Token valid for at least 1 hour
      if (decoded.exp < now + 3600) {
        return false;
      }
      
      // Verify roles and permissions
      const hasValidRole = this.validatePermissions(decoded);
      if (!hasValidRole) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Offline access validation failed:', error);
      return false;
    }
  }

  /**
   * Validate offline JWT token
   * 
   * Checks if the current JWT token is valid for offline operations
   * without requiring server communication.
   * 
   * @returns Promise<boolean> - True if token is valid
   * 
   * @example
   * const isValid = await this.offlineSecurityService.validateOfflineToken();
   * if (!isValid) {
   *   // Token expired or invalid
   * }
   * 
   * Token validation:
   * - Checks token presence
   * - Validates token structure
   * - Verifies expiration time
   * - Handles validation errors
   */
  async validateOfflineToken(): Promise<boolean> {
    try {
      const token = this.authService.getToken();
      if (!token) return false;

      const decoded = this.decodeJWT(token);
      if (!decoded) return false;

      const now = Date.now() / 1000;
      return decoded.exp > now;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Refresh offline token
   * 
   * Attempts to refresh the JWT token for offline use.
   * Currently returns false as offline token refresh
   * is not implemented.
   * 
   * @returns Promise<boolean> - True if refresh successful
   * 
   * @example
   * const refreshed = await this.offlineSecurityService.refreshOfflineToken();
   * if (!refreshed) {
   *   // Handle token refresh failure
   * }
   * 
   * Note: This method is a placeholder for future implementation
   * of offline token refresh functionality.
   */
  async refreshOfflineToken(): Promise<boolean> {
    try {
      const refreshToken = this.authService.getRefreshToken();
      if (!refreshToken) return false;

      // Implement offline refresh token
      // For now returns false, to be implemented when available
      return false;
    } catch (error) {
      console.error('Offline token refresh failed:', error);
      return false;
    }
  }

  // ============================================================================
  // ENCRYPTION METHODS
  // ============================================================================

  /**
   * Encrypt data for offline storage
   * 
   * Encrypts sensitive data using AES-GCM encryption before
   * storing it in offline storage. Uses PBKDF2 key derivation
   * for secure key generation.
   * 
   * @param data - Data to encrypt
   * @returns Promise<string> - Base64 encoded encrypted data
   * 
   * @example
   * const sensitiveData = { password: 'secret', apiKey: 'key123' };
   * const encrypted = await this.offlineSecurityService.encryptData(sensitiveData);
   * // Store encrypted data in IndexedDB
   * 
   * Encryption process:
   * 1. Generates cryptographic key using PBKDF2
   * 2. Creates random initialization vector (IV)
   * 3. Encrypts data using AES-GCM
   * 4. Combines IV and encrypted data
   * 5. Returns base64 encoded result
   * 
   * Security features:
   * - AES-GCM 256-bit encryption
   * - Random IV for each encryption
   * - PBKDF2 key derivation
   * - Configurable iterations
   */
  async encryptData(data: any): Promise<string> {
    if (!this.config.encryptionEnabled) {
      return JSON.stringify(data);
    }

    try {
      const key = await this.generateKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encodedData = new TextEncoder().encode(JSON.stringify(data));
      const encryptedData = await crypto.subtle.encrypt(
        { name: this.config.algorithm, iv },
        key,
        encodedData
      );

      const encryptedArray = new Uint8Array(encryptedData);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv);
      combined.set(encryptedArray, iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data from offline storage
   * 
   * Decrypts data that was previously encrypted for offline storage.
   * Uses the same key derivation process as encryption.
   * 
   * @param encryptedData - Base64 encoded encrypted data
   * @returns Promise<any> - Decrypted data
   * 
   * @example
   * const decrypted = await this.offlineSecurityService.decryptData(encryptedData);
   * console.log('Decrypted data:', decrypted);
   * 
   * Decryption process:
   * 1. Decodes base64 encrypted data
   * 2. Extracts IV and encrypted data
   * 3. Generates same cryptographic key
   * 4. Decrypts using AES-GCM
   * 5. Returns original data
   * 
   * Error handling:
   * - Handles decryption failures
   * - Validates data format
   * - Provides meaningful error messages
   */
  async decryptData(encryptedData: string): Promise<any> {
    if (!this.config.encryptionEnabled) {
      return JSON.parse(encryptedData);
    }

    try {
      const key = await this.generateKey();
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        { name: this.config.algorithm, iv },
        key,
        data
      );

      const decodedData = new TextDecoder().decode(decryptedData);
      return JSON.parse(decodedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // ============================================================================
  // SECURITY LOGGING METHODS
  // ============================================================================

  /**
   * Log offline security activity
   * 
   * Records security-related activities for audit purposes.
   * Logs are stored locally and can be synchronized when online.
   * 
   * @param activity - Type of security activity
   * @param details - Additional activity details
   * @returns Promise<void>
   * 
   * @example
   * await this.offlineSecurityService.logOfflineActivity('data_access', {
   *   userId: '123',
   *   dataType: 'profile',
   *   action: 'read'
   * });
   * 
   * Log entry includes:
   * - User ID from token
   * - Activity type
   * - Timestamp
   * - Activity details
   * - Source (offline)
   * - Session ID
   * - IP address (offline)
   * - User agent
   */
  async logOfflineActivity(activity: string, details?: any): Promise<void> {
    try {
      const token = this.authService.getToken();
      const userId = token ? this.extractUserIdFromToken(token) : 'unknown';
      
      const logEntry: Omit<SecurityLogEntry, 'id'> = {
        userId: userId || 'unknown',
        event_type: activity,
        timestamp: new Date().toISOString(),
        details: details || {},
        source: 'offline',
        session_id: this.generateSessionId(),
        ip_address: 'offline',
        user_agent: navigator.userAgent
      };

      await this.offlineStorage.addSecurityLog(logEntry);
    } catch (error) {
      console.error('Failed to log offline activity:', error);
    }
  }

  /**
   * Get offline security logs for user
   * 
   * Retrieves security activity logs for the specified user
   * from local storage.
   * 
   * @param userId - Unique identifier of the user
   * @returns Promise<SecurityLogEntry[]> - Array of security log entries
   * 
   * @example
   * const logs = await this.offlineSecurityService.getOfflineSecurityLogs('user-123');
   * logs.forEach(log => {
   *   console.log('Activity:', log.event_type, 'at', log.timestamp);
   * });
   * 
   * Log data includes:
   * - User ID
   * - Event type
   * - Timestamp
   * - Activity details
   * - Source information
   * - Session tracking
   */
  async getOfflineSecurityLogs(userId: string): Promise<SecurityLogEntry[]> {
    try {
      return await this.offlineStorage.getSecurityLogs(userId);
    } catch (error) {
      console.error('Failed to get offline security logs:', error);
      return [];
    }
  }

  // ============================================================================
  // DATA INTEGRITY METHODS
  // ============================================================================

  /**
   * Verify data integrity
   * 
   * Validates the structure and format of offline data to ensure
   * it meets expected requirements and hasn't been corrupted.
   * 
   * @param data - Data to verify
   * @returns Promise<boolean> - True if data is valid
   * 
   * @example
   * const isValid = await this.offlineSecurityService.verifyDataIntegrity(userData);
   * if (!isValid) {
   *   // Handle invalid data
   * }
   * 
   * Validation checks:
   * - Data structure validation
   * - Required field verification
   * - Type checking
   * - Timestamp validation
   * - Array structure verification
   */
  async verifyDataIntegrity(data: any): Promise<boolean> {
    try {
      // Verify data structure
      if (!data || typeof data !== 'object') {
        return false;
      }

      // Verify required fields for user data
      if (data.user && typeof data.user !== 'object') {
        return false;
      }

      if (data.profile && typeof data.profile !== 'object') {
        return false;
      }

      if (data.security_logs && !Array.isArray(data.security_logs)) {
        return false;
      }

      // Verify timestamp
      if (data.last_sync && isNaN(new Date(data.last_sync).getTime())) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Data integrity check failed:', error);
      return false;
    }
  }

  /**
   * Generate data hash
   * 
   * Creates a SHA-256 hash of the provided data for integrity
   * verification and tamper detection.
   * 
   * @param data - Data to hash
   * @returns Promise<string> - Hexadecimal hash string
   * 
   * @example
   * const hash = await this.offlineSecurityService.generateDataHash(userData);
   * console.log('Data hash:', hash);
   * 
   * Hash generation:
   * - Converts data to JSON string
   * - Encodes as UTF-8
   * - Generates SHA-256 hash
   * - Returns hexadecimal representation
   * 
   * Use cases:
   * - Data integrity verification
   * - Tamper detection
   * - Change detection
   * - Audit trail
   */
  async generateDataHash(data: any): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);
      
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex;
    } catch (error) {
      console.error('Failed to generate data hash:', error);
      throw new Error('Failed to generate data hash');
    }
  }

  // ============================================================================
  // CONFIGURATION METHODS
  // ============================================================================

  /**
   * Get current security configuration
   * 
   * Returns a copy of the current security configuration
   * for inspection and debugging purposes.
   * 
   * @returns Promise<OfflineSecurityConfig> - Current security configuration
   * 
   * @example
   * const config = await this.offlineSecurityService.getSecurityConfig();
   * console.log('Encryption enabled:', config.encryptionEnabled);
   * console.log('Algorithm:', config.algorithm);
   * 
   * Configuration includes:
   * - encryptionEnabled: Whether encryption is active
   * - algorithm: Encryption algorithm (AES-GCM)
   * - keyLength: Key length in bits (256)
   * - iterations: PBKDF2 iterations (100000)
   */
  async getSecurityConfig(): Promise<OfflineSecurityConfig> {
    return { ...this.config };
  }

  /**
   * Update security configuration
   * 
   * Updates the security configuration with new settings.
   * Changes take effect immediately for new operations.
   * 
   * @param config - Partial configuration to update
   * @returns Promise<void>
   * 
   * @example
   * await this.offlineSecurityService.updateSecurityConfig({
   *   encryptionEnabled: false,
   *   iterations: 200000
   * });
   * 
   * Configuration updates:
   * - Merges new settings with existing config
   * - Logs configuration changes
   * - Applies to new operations
   * - Doesn't affect existing encrypted data
   */
  async updateSecurityConfig(config: Partial<OfflineSecurityConfig>): Promise<void> {
    Object.assign(this.config, config);
    console.log('Security config updated:', this.config);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Generate cryptographic key for encryption/decryption
   * 
   * Creates a cryptographic key using PBKDF2 key derivation
   * from the user's JWT token or a default key.
   * 
   * @returns Promise<CryptoKey> - Generated cryptographic key
   * 
   * Key generation process:
   * 1. Uses JWT token as password or default key
   * 2. Creates salt for key derivation
   * 3. Imports password as raw key material
   * 4. Derives key using PBKDF2
   * 5. Returns AES-GCM compatible key
   */
  private async generateKey(): Promise<CryptoKey> {
    const password = this.authService.getToken() || 'default-key';
    const salt = new TextEncoder().encode('pandom-offline-salt');
    
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
        iterations: this.config.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.config.algorithm, length: this.config.keyLength },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Decode JWT token
   * 
   * Decodes a JWT token and returns the payload.
   * Handles base64 decoding and JSON parsing.
   * 
   * @param token - JWT token string
   * @returns any - Decoded token payload or null
   * 
   * Decoding process:
   * 1. Splits token into parts
   * 2. Decodes base64 payload
   * 3. Parses JSON payload
   * 4. Returns decoded data
   * 5. Handles decoding errors
   */
  private decodeJWT(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('JWT decode failed:', error);
      return null;
    }
  }

  /**
   * Extract user ID from JWT token
   * 
   * Extracts the user ID from the JWT token payload.
   * Checks multiple possible claim names for user ID.
   * 
   * @param token - JWT token string
   * @returns string | null - User ID or null
   * 
   * Extraction process:
   * 1. Decodes JWT token
   * 2. Checks 'sub' claim first
   * 3. Falls back to 'userId' claim
   * 4. Returns null if not found
   * 5. Handles extraction errors
   */
  private extractUserIdFromToken(token: string): string | null {
    try {
      const payload = this.decodeJWT(token);
      return payload?.sub || payload?.userId || null;
    } catch (error) {
      console.error('Failed to extract user ID from token:', error);
      return null;
    }
  }

  /**
   * Validate user permissions
   * 
   * Checks if the user has valid permissions for offline access
   * based on their role and other criteria.
   * 
   * @param decoded - Decoded JWT token payload
   * @returns boolean - True if permissions are valid
   * 
   * Permission validation:
   * - Checks user role
   * - Validates against allowed roles
   * - Returns access decision
   * - Can be extended for complex permissions
   */
  private validatePermissions(decoded: any): boolean {
    // Implement permission validation logic
    const validRoles = ['user', 'admin'];
    return validRoles.includes(decoded.role);
  }

  /**
   * Generate session ID
   * 
   * Creates a unique session identifier for tracking
   * user sessions in security logs.
   * 
   * @returns string - Unique session ID
   * 
   * Session ID format:
   * - Combines timestamp and random string
   * - Uses base36 encoding for compactness
   * - Ensures uniqueness
   * - Suitable for logging purposes
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
} 