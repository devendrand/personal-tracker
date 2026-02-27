import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const STRATEGY_GROUPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./strategy-groups.component').then((m) => m.StrategyGroupsComponent),
    canActivate: [authGuard],
  },
];
