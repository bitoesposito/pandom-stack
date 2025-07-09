import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { CookieAuthService } from '../services/cookie-auth.service';
import { map, catchError, of } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(CookieAuthService);
  
  // Check if user is authenticated using cookie-based auth
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Get required roles from route data
  const requiredRoles = route.data['roles'] as string[];
  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // No roles required
  }

  // For cookie-based auth, we need to get user data from the server
  // This is a simplified check - in production you might want to cache user data
  return authService.getCurrentUser().pipe(
    map(response => {
      if (response.data?.user?.role) {
        const userRole = response.data.user.role;
        if (requiredRoles.includes(userRole)) {
          return true;
        } else {
          router.navigate(['/dashboard']);
          return false;
        }
      } else {
        router.navigate(['/login']);
        return false;
      }
    }),
    catchError(() => {
      authService.logout().subscribe(() => {
        router.navigate(['/login']);
      });
      return of(false);
    })
  );
}; 