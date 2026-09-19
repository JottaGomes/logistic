import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Attaches the JWT to outgoing requests.
 *
 * The auth endpoints are skipped on purpose: they are how a session is obtained,
 * so sending an existing token to them is pointless, and a stale one would make
 * logging in fail for the very reason the user is logging in again.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const auth = inject(AuthService);
  const token = auth.getToken();

  if (!token || req.url.includes('/api/auth/')) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
