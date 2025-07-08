import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ApiResponse } from '../models/api-base.models';
import { TranslateService } from '@ngx-translate/core';

interface DebounceMap {
  [key: string]: number;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private debounceMap: DebounceMap = {};
    private debounceTime = 3000; // ms

    constructor(
        private messageService: MessageService,
        private http: HttpClient,
        private translate: TranslateService
    ) {}

    private showMessageDebounced(severity: 'success' | 'error' | 'info' | 'warning', key: string, params?: any, debounceKey?: string): void {
        const now = Date.now();
        const dKey = debounceKey || key + severity;
        if (this.debounceMap[dKey] && now - this.debounceMap[dKey] < this.debounceTime) {
            return;
        }
        this.debounceMap[dKey] = now;
        this.translate.get(key, params).subscribe((msg: string) => {
            this.showMessage(severity, msg);
        });
    }

    /**
     * Handles error or success messages in a centralized way
     * @param severity Message type (success/error/info/warning)
     * @param message Message to display
     */
    showMessage(severity: 'success' | 'error' | 'info' | 'warning', message: string): void {
        let summary = '';
        switch (severity) {
            case 'success': summary = this.translate.instant('notification.success'); break;
            case 'error': summary = this.translate.instant('notification.error'); break;
            case 'info': summary = this.translate.instant('notification.info'); break;
            case 'warning': summary = this.translate.instant('notification.warning'); break;
            default: summary = this.translate.instant('notification.info'); break;
        }
        this.messageService.add({ severity, summary, detail: message });
    }

    /**
     * Handles API responses by showing an appropriate message
     * @param response API response
     * @param key Translation key for the default message
     */
    handleApiResponse<T>(response: ApiResponse<T>, key: string): void {
        this.translate.get(key).subscribe((msg: string) => {
            if (response.success) {
                this.showMessage('success', response.message || msg);
            } else {
                this.showMessage('error', response.message || msg);
            }
        });
    }

    /**
     * Handles HTTP errors by showing an appropriate message
     * @param error HTTP error
     * @param key Translation key for the default message
     */
    handleError(error: any, key: string): void {
        this.translate.get(key).subscribe((msg: string) => {
            let errorMessage = msg;
            if (error?.error?.message) {
                errorMessage = error.error.message;
            } else if (error?.error?.data?.message) {
                errorMessage = error.error.data.message;
            } else if (typeof error?.error === 'string') {
                try {
                    errorMessage = JSON.parse(error.error).message || msg;
                } catch {
                    errorMessage = error.error;
                }
            } else if (error?.message) {
                errorMessage = error.message;
            }
            this.showMessage('error', errorMessage);
        });
    }

    /**
     * Handles successful API call responses
     * @param key Translation key for the success message
     * @param params Optional parameters for the translation
     */
    handleSuccess(key: string, params?: any): void {
        this.translate.get(key, params).subscribe((msg: string) => {
            this.showMessage('success', msg);
        });
    }

    /**
     * Handles API call warning responses
     * @param key Translation key for the warning message
     * @param params Optional parameters for the translation
     */
    handleWarning(key: string, params?: any): void {
        this.translate.get(key, params).subscribe((msg: string) => {
            this.showMessage('warning', msg);
        });
    }

    /**
     * Handles API call info responses
     * @param key Translation key for the info message
     * @param params Optional parameters for the translation
     */
    handleInfo(key: string, params?: any): void {
        this.translate.get(key, params).subscribe((msg: string) => {
            this.showMessage('info', msg);
        });
    }

    // DRY helpers
    notifyOfflineSaved(): void {
        this.showMessageDebounced('success', 'offline.saved');
    }
    notifyOfflineQueued(): void {
        this.showMessageDebounced('info', 'offline.queued');
    }
    notifyOfflineError(): void {
        this.showMessageDebounced('error', 'offline.error');
    }
    notifySyncBatch(count: number): void {
        this.handleSuccess('offline.sync_batch', { count });
    }
    notifySyncError(): void {
        this.handleWarning('offline.sync_error');
    }
    notifyOfflineState(isOnline: boolean): void {
        if (isOnline) {
            this.handleInfo('offline.online');
        } else {
            this.handleWarning('offline.offline');
        }
    }
}