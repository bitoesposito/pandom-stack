import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authRedirectGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (!token) {
    return true;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp;
    
    if (expiry && Date.now() < expiry * 1000) {
      // Token valido, reindirizza in base al ruolo
      if (payload.role === 'admin') {
        router.navigate(['/private/dashboard']);
      } else {
        router.navigate(['/private/edit', payload.sub]);
      }
      return false;
    }
  } catch {
    // Se c'è un errore nella decodifica, rimuovi il token e procedi
    authService.logout();
  }

  return true;
}; 