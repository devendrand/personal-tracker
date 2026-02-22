import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Auth guard that protects routes requiring authentication.
 * 
 * STUB: Currently checks for token in localStorage.
 * Will be enhanced with proper auth service in future milestone.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');
  
  if (token) {
    return true;
  }
  
  // Redirect to dashboard (no login page yet)
  router.navigate(['/dashboard']);
  return false;
};
