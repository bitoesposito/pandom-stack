import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ApiResponse } from '../models/api.models';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    constructor(
        private messageService: MessageService,
        private http: HttpClient
    ) {}

    /**
     * Handles error or success messages in a centralized way
     * @param severity Message type (success/error)
     * @param message Message to display
     */
    showMessage(severity: 'success' | 'error', message: string): void {
        let summary = '';
    
        switch (severity) {
            case 'success':
                summary = 'Success';
                break;
            case 'error':
                summary = 'Error';
                break;
        }
    
        this.messageService.add({
            severity,
            summary,
            detail: message
        });
    }

    /**
     * Handles API responses by showing an appropriate message
     * @param response API response
     * @param defaultMessage Default message if the response doesn't contain a message
     */
    handleApiResponse<T>(response: ApiResponse<T>, defaultMessage: string): void {
        if (response.success) {
            this.showMessage('success', response.message || defaultMessage);
        } else {
            this.showMessage('error', response.message || defaultMessage);
        }
    }

    /**
     * Handles HTTP errors by showing an appropriate message
     * @param error HTTP error
     * @param defaultMessage Default message if the error doesn't contain a message
     */
    handleError(error: any, defaultMessage: string): void {
        let errorMessage = defaultMessage;

        if (error?.error?.message) {
            errorMessage = error.error.message;
        } else if (error?.error?.data?.message) {
            errorMessage = error.error.data.message;
        } else if (typeof error?.error === 'string') {
            try {
                const parsed = JSON.parse(error.error);
                errorMessage = parsed.message || defaultMessage;
            } catch {
                errorMessage = error.error;
            }
        } else if (error?.message) {
            errorMessage = error.message;
        }

        this.showMessage('error', errorMessage);
    }

    /**
     * Handles successful API call responses
     * @param message Success message to display to the user
     */
    handleSuccess(message: string): void {
        this.showMessage('success', message);
    }

    /**
     * Handles API call warning responses
     * @param message Warning message to display to the user
     */
    handleWarning(message: string): void {
        this.showMessage('error', message);
    }
}
