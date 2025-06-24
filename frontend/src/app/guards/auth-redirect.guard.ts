import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authRedirectGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

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
    localStorage.removeItem('access_token');
  }

  return true;
}; 