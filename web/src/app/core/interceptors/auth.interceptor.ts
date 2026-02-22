import { HttpInterceptorFn } from '@angular/common/http';

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
  
  return next(req);
};
