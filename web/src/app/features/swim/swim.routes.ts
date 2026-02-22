import { Routes } from '@angular/router';

export const SWIM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/swim-dashboard/swim-dashboard.component').then(
        (m) => m.SwimDashboardComponent
      ),
    title: 'Swim Dashboard'
  },
  {
    path: 'log',
    loadComponent: () =>
      import('./components/time-log/time-log.component').then(
        (m) => m.TimeLogComponent
      ),
    title: 'Log Time'
  },
  {
    path: 'times',
    loadComponent: () =>
      import('./components/time-list/time-list.component').then(
        (m) => m.TimeListComponent
      ),
    title: 'All Times'
  },
  {
    path: 'progression/:eventId',
    loadComponent: () =>
      import('./components/event-progress-chart/event-progress-chart.component').then(
        (m) => m.EventProgressChartComponent
      ),
    title: 'Event Progression'
  },
  {
    path: 'profiles',
    loadComponent: () =>
      import('./components/swim-profile/swim-profile.component').then(
        (m) => m.SwimProfileComponent
      ),
    title: 'Swimmer Profiles'
  }
];
