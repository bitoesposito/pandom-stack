import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decoded: any = jwtDecode(token);
    const userRole = decoded.role;

    // All authenticated users can access the dashboard
    if (state.url === '/private/dashboard') {
      return true;
    }

    // If user is admin, they can access all private routes
    if (userRole === 'admin') {
      return true;
    }

    // For all other private routes, redirect to dashboard
    router.navigate(['/private/dashboard']);
    return false;
  } catch (error) {
    authService.logout();
    router.navigate(['/login']);
    return false;
  }
}; 