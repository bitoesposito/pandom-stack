import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decoded: any = jwtDecode(token);
    
    if (!decoded.exp || Date.now() >= decoded.exp * 1000) {
      localStorage.removeItem('access_token');
      router.navigate(['/login']);
      return false;
    }

    return true;
  } catch (error) {
    localStorage.removeItem('access_token');
    router.navigate(['/login']);
    return false;
  }
}; 