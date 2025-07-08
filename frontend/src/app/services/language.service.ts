import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Language } from '../models/language.models';
import { ApplicationRef } from '@angular/core';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'selectedLanguage';
  private readonly DEFAULT_LANGUAGE = 'en-US';
  
  private availableLanguages: Language[] = [
    {
      name: 'English',
      code: 'en-US',
      flag: './assets/flags/US.png'
    },
    {
      name: 'Italiano',
      code: 'it-IT',
      flag: './assets/flags/IT.png'
    }
  ];

  private currentLanguageSubject = new BehaviorSubject<string>(this.DEFAULT_LANGUAGE);
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor(
    private translate: TranslateService,
    private appRef: ApplicationRef
  ) {
    this.initializeLanguage();
  }

  /**
   * Initialize the language service
   */
  private initializeLanguage(): void {
    // Set available languages
    this.translate.addLangs(['en-US', 'it-IT']);
    
    // Set default language
    this.translate.setDefaultLang(this.DEFAULT_LANGUAGE);
    
    // Load saved language or use default
    const savedLanguage = this.getSavedLanguage();
    this.setLanguage(savedLanguage);
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages(): Language[] {
    return [...this.availableLanguages];
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  /**
   * Set language and save to storage
   */
  setLanguage(languageCode: string): void {
    // Validate language code
    if (!this.isValidLanguage(languageCode)) {
      console.warn(`Invalid language code: ${languageCode}. Using default.`);
      languageCode = this.DEFAULT_LANGUAGE;
    }

    // Set the language
    this.translate.use(languageCode);
    this.currentLanguageSubject.next(languageCode);
    
    // Save to localStorage
    this.saveLanguage(languageCode);
    
    // Force application-wide change detection
    setTimeout(() => {
      this.appRef.tick();
    }, 100);
  }

  /**
   * Change language (alias for setLanguage)
   */
  changeLanguage(languageCode: string): void {
    this.setLanguage(languageCode);
  }

  /**
   * Get saved language from localStorage
   */
  private getSavedLanguage(): string {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved && this.isValidLanguage(saved) ? saved : this.DEFAULT_LANGUAGE;
    } catch (error) {
      console.warn('Error reading language from localStorage:', error);
      return this.DEFAULT_LANGUAGE;
    }
  }

  /**
   * Save language to localStorage
   */
  private saveLanguage(languageCode: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, languageCode);
    } catch (error) {
      console.warn('Error saving language to localStorage:', error);
    }
  }

  /**
   * Check if language code is valid
   */
  private isValidLanguage(languageCode: string): boolean {
    return this.availableLanguages.some(lang => lang.code === languageCode);
  }

  /**
   * Get language object by code
   */
  getLanguageByCode(code: string): Language | undefined {
    return this.availableLanguages.find(lang => lang.code === code);
  }

  /**
   * Get current language object
   */
  getCurrentLanguageObject(): Language | undefined {
    return this.getLanguageByCode(this.getCurrentLanguage());
  }

  /**
   * Get current language as observable
   */
  getCurrentLanguageObject$(): Observable<Language | undefined> {
    return this.currentLanguage$.pipe(
      map(languageCode => this.getLanguageByCode(languageCode))
    );
  }

  /**
   * Get current language name
   */
  getCurrentLanguageName(): string {
    const currentLang = this.getCurrentLanguageObject();
    return currentLang ? currentLang.name : 'English';
  }

  /**
   * Reset to default language
   */
  resetToDefault(): void {
    this.setLanguage(this.DEFAULT_LANGUAGE);
  }

  /**
   * Clear saved language preference
   */
  clearSavedLanguage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Error clearing language from localStorage:', error);
    }
  }
} 