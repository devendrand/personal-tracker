import { Routes } from '@angular/router';

export const NETWORTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/networth-dashboard/networth-dashboard.component').then(
        (m) => m.NetWorthDashboardComponent
      ),
    title: 'Net Worth Dashboard'
  },
  {
    path: 'accounts',
    loadComponent: () =>
      import('./components/account-management/account-management.component').then(
        (m) => m.AccountManagementComponent
      ),
    title: 'Manage Accounts'
  },
  {
    path: 'snapshot/new',
    loadComponent: () =>
      import('./components/snapshot-entry/snapshot-entry.component').then(
        (m) => m.SnapshotEntryComponent
      ),
    title: 'New Snapshot'
  },
  {
    path: 'snapshots',
    loadComponent: () =>
      import('./components/snapshot-list/snapshot-list.component').then(
        (m) => m.SnapshotListComponent
      ),
    title: 'Snapshot History'
  },
  {
    path: 'snapshot/:id',
    loadComponent: () =>
      import('./components/snapshot-list/snapshot-list.component').then(
        (m) => m.SnapshotListComponent
      ),
    title: 'Snapshot Details'
  },
  {
    path: 'trend',
    loadComponent: () =>
      import('./components/networth-trend/networth-trend.component').then(
        (m) => m.NetWorthTrendComponent
      ),
    title: 'Net Worth Trend'
  }
];
