import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, of, switchMap, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

type TokenResponse = {
  access_token: string;
  token_type?: string;
};

/**
 * Auth interceptor that adds JWT Bearer token to outgoing requests.
 * 
 * STUB: Currently uses localStorage for token storage.
 * Will be enhanced with proper token management in future milestone.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  // Dev convenience: if no token is present, bootstrap one on-demand.
  // This avoids requiring manual DevTools setup during local development.
  if (!environment.production && !req.url.includes('/auth/dev-token')) {
    const http = inject(HttpClient);
    const baseUrl = environment.apiUrl.replace(/\/$/, '');
    const devTokenUrl = `${baseUrl}/auth/dev-token`;

    return http.get<TokenResponse>(devTokenUrl).pipe(
      tap((resp) => {
        if (resp?.access_token) {
          localStorage.setItem('access_token', resp.access_token);
        }
      }),
      switchMap((resp) => {
        const bootstrappedToken = resp?.access_token;
        if (!bootstrappedToken) {
          return next(req);
        }
        return next(
          req.clone({
            setHeaders: {
              Authorization: `Bearer ${bootstrappedToken}`,
            },
          }),
        );
      }),
      catchError(() => next(req)),
    );
  }
  
  return next(req);
};
