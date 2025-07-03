import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { OfflineStorageService } from './offline-storage.service';
import {
  SecurityLogEntry,
  OfflineSecurityConfig
} from '../models/offline.models';

@Injectable({
  providedIn: 'root'
})
export class OfflineSecurityService {
  private readonly config: OfflineSecurityConfig = {
    encryptionEnabled: true,
    algorithm: 'AES-GCM',
    keyLength: 256,
    iterations: 100000
  };

  constructor(
    private authService: AuthService,
    private offlineStorage: OfflineStorageService
  ) {}

  async validateOfflineAccess(): Promise<boolean> {
    try {
      const token = this.authService.getToken();
      if (!token) {
        console.log('No token found, offline access denied');
        return false;
      }

      // Verifica token JWT
      const decoded = this.decodeJWT(token);
      if (!decoded) {
        console.log('Invalid token, offline access denied');
        return false;
      }

      const now = Date.now() / 1000;
      
      // Token valido per almeno 1 ora
      if (decoded.exp < now + 3600) {
        console.log('Token expires soon, offline access denied');
        return false;
      }
      
      // Verifica ruoli e permessi
      const hasValidRole = this.validatePermissions(decoded);
      if (!hasValidRole) {
        console.log('Invalid permissions, offline access denied');
        return false;
      }

      console.log('Offline access validated successfully');
      return true;
    } catch (error) {
      console.error('Offline access validation failed:', error);
      return false;
    }
  }

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
      console.log('Offline activity logged:', activity);
    } catch (error) {
      console.error('Failed to log offline activity:', error);
    }
  }

  async verifyDataIntegrity(data: any): Promise<boolean> {
    try {
      // Verifica struttura dati
      if (!data || typeof data !== 'object') {
        return false;
      }

      // Verifica campi obbligatori per dati utente
      if (data.user && typeof data.user !== 'object') {
        return false;
      }

      if (data.profile && typeof data.profile !== 'object') {
        return false;
      }

      if (data.security_logs && !Array.isArray(data.security_logs)) {
        return false;
      }

      // Verifica timestamp
      if (data.last_sync && isNaN(new Date(data.last_sync).getTime())) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Data integrity check failed:', error);
      return false;
    }
  }

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

  async getOfflineSecurityLogs(userId: string): Promise<SecurityLogEntry[]> {
    try {
      return await this.offlineStorage.getSecurityLogs(userId);
    } catch (error) {
      console.error('Failed to get offline security logs:', error);
      return [];
    }
  }

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

  async refreshOfflineToken(): Promise<boolean> {
    try {
      const refreshToken = this.authService.getRefreshToken();
      if (!refreshToken) return false;

      // Implementa refresh token offline
      // Per ora ritorna false, da implementare quando disponibile
      console.log('Offline token refresh not implemented yet');
      return false;
    } catch (error) {
      console.error('Offline token refresh failed:', error);
      return false;
    }
  }

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

  private decodeJWT(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('JWT decode failed:', error);
      return null;
    }
  }

  private extractUserIdFromToken(token: string): string | null {
    try {
      const payload = this.decodeJWT(token);
      return payload?.sub || payload?.userId || null;
    } catch (error) {
      console.error('Failed to extract user ID from token:', error);
      return null;
    }
  }

  private validatePermissions(decoded: any): boolean {
    // Implementa logica di validazione permessi
    const validRoles = ['user', 'admin'];
    return validRoles.includes(decoded.role);
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Metodi di utilità per debug
  async getSecurityConfig(): Promise<OfflineSecurityConfig> {
    return { ...this.config };
  }

  async updateSecurityConfig(config: Partial<OfflineSecurityConfig>): Promise<void> {
    Object.assign(this.config, config);
    console.log('Security config updated:', this.config);
  }
} 