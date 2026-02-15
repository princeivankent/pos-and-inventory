import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

const AUTH_URLS = ['/auth/login', '/auth/register'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error) => {
      const message = error.error?.message || 'An unexpected error occurred';
      const isAuthUrl = AUTH_URLS.some((url) => req.url.includes(url));

      switch (error.status) {
        case 401:
          if (!isAuthUrl) {
            // Only logout once — check if still authenticated to avoid cascade
            if (auth.getToken()) {
              auth.logout();
              toast.error('Session Expired', 'Please sign in again');
            }
          } else {
            toast.error('Login Failed', message);
          }
          break;
        case 402:
          toast.error(
            'Subscription Required',
            'Your subscription is inactive. Please renew to continue.'
          );
          break;
        case 403:
          // Check if it's a subscription feature gate error
          if (message.includes('does not include this feature') || message.includes('Please upgrade')) {
            toast.error(
              'Feature Locked',
              'This feature requires an upgraded plan. Visit Settings to upgrade.'
            );
          } else {
            toast.error('Access Denied', message);
          }
          break;
        case 404:
          toast.error('Not Found', message);
          break;
        case 0:
          toast.error('Connection Error', 'Unable to reach the server');
          break;
        default:
          if (error.status >= 400) {
            toast.error('Error', message);
          }
      }

      return throwError(() => error);
    })
  );
};
