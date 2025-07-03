import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../services/auth.service';

export const authRedirectGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (!token) {
    return true;
  }

  try {
    const decoded: any = jwtDecode(token);
    
    if (decoded.exp && Date.now() < decoded.exp * 1000) {
      // Token valido, reindirizza alla dashboard
      router.navigate(['/private/dashboard']);
      return false;
    }
  } catch {
    // Se c'è un errore nella decodifica, rimuovi il token e procedi
    authService.logout();
  }

  return true;
}; 