import {
  HttpClient,
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

interface TokenResponse {
  access_token: string;
  token_type?: string;
}

const DID_RETRY = new HttpContextToken<boolean>(() => false);

/**
 * Auth interceptor that adds JWT Bearer token to outgoing requests.
 * 
 * STUB: Currently uses localStorage for token storage.
 * Will be enhanced with proper token management in future milestone.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const token = localStorage.getItem('access_token');

  const baseUrl = environment.apiUrl.replace(/\/$/, '');
  const devTokenUrl = `${baseUrl}/auth/dev-token`;

  const bootstrapDevToken = () =>
    http.get<TokenResponse>(devTokenUrl).pipe(
      tap((resp) => {
        if (resp?.access_token) {
          localStorage.setItem('access_token', resp.access_token);
        }
      }),
    );
  
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(clonedRequest).pipe(
      catchError((err: unknown) => {
        const is401 = err instanceof HttpErrorResponse && err.status === 401;
        if (
          environment.production ||
          !is401 ||
          req.context.get(DID_RETRY) ||
          req.url.includes('/auth/dev-token')
        ) {
          return throwError(() => err);
        }

        localStorage.removeItem('access_token');
        return bootstrapDevToken().pipe(
          switchMap((resp) => {
            if (!resp?.access_token) {
              return throwError(() => err);
            }
            return next(
              req.clone({
                setHeaders: { Authorization: `Bearer ${resp.access_token}` },
                context: req.context.set(DID_RETRY, true),
              }),
            );
          }),
          catchError(() => throwError(() => err)),
        );
      }),
    );
  }

  // Dev convenience: if no token is present, bootstrap one on-demand.
  // This avoids requiring manual DevTools setup during local development.
  if (!environment.production && !req.url.includes('/auth/dev-token')) {
    return bootstrapDevToken().pipe(
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
            context: req.context.set(DID_RETRY, true),
          }),
        );
      }),
      catchError(() => next(req)),
    );
  }
  
  return next(req);
};
