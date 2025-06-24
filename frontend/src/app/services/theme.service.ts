import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkMode = new BehaviorSubject<boolean>(false);
  isDarkMode$ = this.isDarkMode.asObservable();

  constructor() {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.setDarkMode(savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setDarkMode(prefersDark);
    }
  }

  toggleDarkMode() {
    this.setDarkMode(!this.isDarkMode.value);
  }

  private setDarkMode(isDark: boolean) {
    this.isDarkMode.next(isDark);
    const element = document.querySelector('html');
    if (isDark) {
      element?.classList.add('my-app-dark');
      element?.classList.remove('surface-50');
    } else {
      element?.classList.remove('my-app-dark');
      element?.classList.add('surface-50');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }
} 