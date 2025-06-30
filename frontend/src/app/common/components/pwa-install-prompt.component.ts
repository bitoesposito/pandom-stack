import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PwaService } from '../../services/pwa.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, TranslateModule],
  template: `
    <div *ngIf="showInstallPrompt" class="fixed bottom-0 right-0 m-3 p-3 z-5 surface-ground shadow-2 border-round-md max-w-20rem flex flex-column gap-2">
      <div class="flex align-items-center gap-2">
        <i class="pi pi-download text-primary"></i>
        <span class="font-semibold">{{ 'pwa.install.title' | translate }}</span>
      </div>
      <div class="flex flex-column gap-2">
        <p>{{ 'pwa.install.description' | translate }}</p>
        <div class="flex gap-2">
          <p-button 
            [label]="'pwa.install.install' | translate" 
            severity="primary" 
            size="small"
            (click)="installPWA()">
          </p-button>
          <p-button 
            [label]="'pwa.install.later' | translate" 
            severity="secondary" 
            outlined="true"
            size="small"
            (click)="dismissPrompt()">
          </p-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pwa-install-prompt {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 300px;
    }
    
    .pwa-install-card {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .pwa-install-content p {
      margin: 0;
      color: var(--text-color-secondary);
      font-size: 0.875rem;
    }
  `]
})
export class PwaInstallPromptComponent implements OnInit, OnDestroy {
  showInstallPrompt = false;
  private deferredPrompt: any;

  constructor(private pwaService: PwaService) {}

  ngOnInit(): void {
    this.initializeInstallPrompt();
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
  }

  private initializeInstallPrompt(): void {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    
    // Check if already installed
    if (this.pwaService.isPWAInstalled()) {
      this.showInstallPrompt = false;
    }
  }

  private handleBeforeInstallPrompt = (e: Event): void => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    this.deferredPrompt = e;
    
    // Show the install prompt
    this.showInstallPrompt = true;
  };

  async installPWA(): Promise<void> {
    if (this.deferredPrompt) {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferredPrompt
      this.deferredPrompt = null;
      
      // Hide the install prompt
      this.showInstallPrompt = false;
    }
  }

  dismissPrompt(): void {
    this.showInstallPrompt = false;
    // Store in localStorage to remember user's choice
    localStorage.setItem('pwa-install-dismissed', 'true');
  }
} 