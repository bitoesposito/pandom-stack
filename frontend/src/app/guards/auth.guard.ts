import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decoded: any = jwtDecode(token);
    
    if (!decoded.exp || Date.now() >= decoded.exp * 1000) {
      authService.logout();
      router.navigate(['/login']);
      return false;
    }

    return true;
  } catch (error) {
    authService.logout();
    router.navigate(['/login']);
    return false;
  }
}; 