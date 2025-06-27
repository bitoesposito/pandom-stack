import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    
    return next(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        // If we get a 401 (Unauthorized), try to refresh the token
        if (error.status === 401) {
          const refreshToken = authService.getRefreshToken();
          
          if (refreshToken) {
            return authService.refreshToken().pipe(
              switchMap((response) => {
                if (response.success && response.data) {
                  // Store new tokens
                  authService.setToken(response.data.access_token);
                  if (response.data.refresh_token) {
                    authService.setRefreshToken(response.data.refresh_token);
                  }
                  
                  // Retry the original request with new token
                  const newToken = authService.getToken();
                  const newCloned = req.clone({
                    headers: req.headers.set('Authorization', `Bearer ${newToken}`)
                  });
                  return next(newCloned);
                } else {
                  // Refresh failed, redirect to login
                  authService.logout();
                  router.navigate(['/login']);
                  return throwError(() => error);
                }
              }),
              catchError((refreshError) => {
                // Refresh token failed, redirect to login
                authService.logout();
                router.navigate(['/login']);
                return throwError(() => refreshError);
              })
            );
          } else {
            // No refresh token available, redirect to login
            authService.logout();
            router.navigate(['/login']);
          }
        }
        
        return throwError(() => error);
      })
    );
  }

  return next(req);
}; 