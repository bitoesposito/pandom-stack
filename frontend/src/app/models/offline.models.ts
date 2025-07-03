// Modelli e interfacce per funzionalità offline

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

export interface QueueStats {
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

export interface SyncResult {
  operation_id: string;
  success: boolean;
  error?: string;
  retry_count: number;
  timestamp: string;
  response_data?: any;
}

export interface OfflineMetrics {
  offline_time: number;
  operations_queued: number;
  sync_success_rate: number;
  data_freshness: number;
  last_sync: string;
}

export interface OfflineSecurityConfig {
  encryptionEnabled: boolean;
  algorithm: string;
  keyLength: number;
  iterations: number;
} 