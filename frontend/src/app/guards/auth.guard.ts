import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { CookieAuthService } from '../services/cookie-auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(CookieAuthService);

  // First check local sessionStorage for immediate response
  const localAuth = authService.isAuthenticated();
  
  if (localAuth) {
    return true;
  }

  // If no local auth, check with server (only once)
  return authService.checkAuthStatus().pipe(
    map(response => {
      if (response.success && response.data?.authenticated) {
        authService.setAuthStatus('authenticated');
        return true;
      } else {
        router.navigate(['/login']);
        return false;
      }
    }),
    catchError(error => {
      console.error('Auth check failed:', error);
      router.navigate(['/login']);
      return of(false);
    })
  );
}; 