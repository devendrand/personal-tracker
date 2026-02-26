import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { Component } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { routes } from './app.routes';

@Component({
  standalone: true,
  template: ''
})
class DummyDashboardComponent {}

@Component({
  standalone: true,
  template: ''
})
class DummyTransactionsComponent {}

describe('App routes', () => {
  it('includes a redirect for /portfolios and does not lazy-load a portfolios page', () => {
    const portfoliosRoutes = routes.filter((r) => r.path === 'portfolios');
    expect(portfoliosRoutes.length).toBe(1);

    const portfoliosRoute = portfoliosRoutes[0] as unknown as {
      redirectTo?: string;
      pathMatch?: string;
      loadComponent?: unknown;
    };

    expect(portfoliosRoute.redirectTo).toBe('dashboard');
    expect(portfoliosRoute.pathMatch).toBe('full');
    expect(portfoliosRoute.loadComponent).toBeUndefined();
  });

  it('redirects /portfolios to /dashboard (URL updates)', fakeAsync(() => {
    const testRoutes = routes.map((r) =>
      r.path === 'dashboard'
        ? { path: 'dashboard', component: DummyDashboardComponent }
        : r.path === 'transactions'
          ? { path: 'transactions', component: DummyTransactionsComponent }
          : r
    );

    TestBed.configureTestingModule({
      providers: [provideRouter(testRoutes), provideLocationMocks()]
    });

    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    router.navigateByUrl('/portfolios');
    tick();

    expect(location.path()).toBe('/dashboard');
  }));

  it('handles browser back navigation consistently after redirecting from /portfolios', fakeAsync(() => {
    const testRoutes = routes.map((r) =>
      r.path === 'dashboard'
        ? { path: 'dashboard', component: DummyDashboardComponent }
        : r.path === 'transactions'
          ? { path: 'transactions', component: DummyTransactionsComponent }
          : r
    );

    TestBed.configureTestingModule({
      providers: [provideRouter(testRoutes), provideLocationMocks()]
    });

    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    router.navigateByUrl('/transactions');
    tick();
    expect(location.path()).toBe('/transactions');

    router.navigateByUrl('/portfolios');
    tick();
    expect(location.path()).toBe('/dashboard');

    location.back();
    tick();
    expect(location.path()).toBe('/transactions');
  }));
});
