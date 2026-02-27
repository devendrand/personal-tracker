import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const PNL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pnl.component').then((m) => m.PnlComponent),
    canActivate: [authGuard],
  },
];
