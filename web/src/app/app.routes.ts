import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  // Trade Tracker
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    title: 'Dashboard - Personal Tracker'
  },
  {
    path: 'transactions',
    loadComponent: () => import('./features/transactions/transactions.component')
      .then(m => m.TransactionsComponent),
    title: 'Transactions - Personal Tracker'
  },
  {
    path: 'portfolios',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  // Strategy Groups
  {
    path: 'strategy-groups',
    loadChildren: () => import('./features/strategy-groups/strategy-groups.routes')
      .then(m => m.STRATEGY_GROUPS_ROUTES),
    title: 'Strategy Groups - Personal Tracker'
  },
  // PnL
  {
    path: 'pnl',
    loadChildren: () => import('./features/pnl/pnl.routes')
      .then(m => m.PNL_ROUTES),
    title: 'PnL - Personal Tracker'
  },
  // Swim Performance Tracker
  {
    path: 'swim',
    loadChildren: () => import('./features/swim/swim.routes')
      .then(m => m.SWIM_ROUTES),
    title: 'Swim Tracker - Personal Tracker'
  },
  // Net Worth Tracker
  {
    path: 'networth',
    loadChildren: () => import('./features/networth/networth.routes')
      .then(m => m.NETWORTH_ROUTES),
    title: 'Net Worth - Personal Tracker'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
