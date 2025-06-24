/**
 * Interfaccia generica per tutte le risposte API
 * Gestisce sia i casi di successo che di errore
 * @template T - Tipo dei dati restituiti in caso di successo
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  status?: number;  // Opzionale, presente solo in caso di errore
}