import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decoded: any = jwtDecode(token);
    const userRole = decoded.role;

    // If user is admin, they can access all private routes
    if (userRole === 'admin') {
      return true;
    }

    // If user is not admin, they can only access the edit page
    if (state.url === '/private/edit' || state.url.startsWith('/private/edit/')) {
      return true;
    }

    // For all other private routes, redirect to edit page
    router.navigate(['/private/edit', decoded.sub]);
    return false;
  } catch (error) {
    localStorage.removeItem('access_token');
    router.navigate(['/login']);
    return false;
  }
}; 