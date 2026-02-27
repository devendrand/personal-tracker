import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { PnlComponent } from './pnl.component';
import { PnLSummaryResponse } from './models/pnl.models';

const EMPTY_PNL: PnLSummaryResponse = {
  total_realized_pnl: '0.000000',
  tickers: []
};

const SAMPLE_PNL: PnLSummaryResponse = {
  total_realized_pnl: '300.000000',
  tickers: [
    {
      symbol: 'AAPL',
      total_realized_pnl: '300.000000',
      groups: [
        {
          strategy_group_id: 'grp-1',
          name: 'AAPL Wheel Q1',
          total_realized_pnl: '300.000000',
          legs: [
            {
              transaction_id: 'txn-1',
              activity_date: '2026-01-15',
              activity_type: 'Sold Short',
              description: 'PUT AAPL 02/27/26 180.000',
              leg_type: 'CSP',
              amount: '150.000000',
              realized_pnl: '150.000000'
            },
            {
              transaction_id: 'txn-2',
              activity_date: '2026-01-20',
              activity_type: 'Expired',
              description: 'PUT AAPL EXP',
              leg_type: 'CSP',
              amount: '0.000000',
              realized_pnl: '0.000000'
            }
          ]
        }
      ]
    }
  ]
};

describe('PnlComponent', () => {
  let fixture: ComponentFixture<PnlComponent>;
  let component: PnlComponent;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['getPnL']);
    api.getPnL.and.returnValue(of(SAMPLE_PNL));

    await TestBed.configureTestingModule({
      imports: [PnlComponent, NoopAnimationsModule],
      providers: [{ provide: ApiService, useValue: api }]
    }).compileComponents();

    fixture = TestBed.createComponent(PnlComponent);
    component = fixture.componentInstance;
  });

  it('loads PnL data on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component.pnl()).toEqual(SAMPLE_PNL);
    expect(component.loading()).toBeFalse();
  }));

  it('shows empty state when tickers list is empty', fakeAsync(() => {
    api.getPnL.and.returnValue(of(EMPTY_PNL));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No PnL data yet');
  }));

  it('handles API error gracefully', fakeAsync(() => {
    api.getPnL.and.returnValue(throwError(() => new Error('Network error')));
    fixture.detectChanges();
    tick();
    expect(component.loading()).toBeFalse();
    expect(component.pnl()).toBeNull();
  }));

  it('toggleTicker expands and collapses a ticker', () => {
    component.toggleTicker('AAPL');
    expect(component.expandedTickers().has('AAPL')).toBeTrue();
    component.toggleTicker('AAPL');
    expect(component.expandedTickers().has('AAPL')).toBeFalse();
  });

  it('toggleGroup expands and collapses a group', () => {
    component.toggleGroup('AAPL', 'grp-1');
    expect(component.isGroupExpanded('AAPL', 'grp-1')).toBeTrue();
    component.toggleGroup('AAPL', 'grp-1');
    expect(component.isGroupExpanded('AAPL', 'grp-1')).toBeFalse();
  });

  it('isGroupExpanded uses null group id for ungrouped', () => {
    component.toggleGroup('AAPL', null);
    expect(component.isGroupExpanded('AAPL', null)).toBeTrue();
  });

  it('toNumber parses decimal strings', () => {
    expect(component.toNumber('150.000000')).toBeCloseTo(150);
    expect(component.toNumber('-50.00')).toBeCloseTo(-50);
  });

  it('isPositive and isNegative classify correctly', () => {
    expect(component.isPositive('150.00')).toBeTrue();
    expect(component.isPositive('-10.00')).toBeFalse();
    expect(component.isNegative('-10.00')).toBeTrue();
    expect(component.isNegative('150.00')).toBeFalse();
  });

  it('renders ticker symbol after data loads', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('AAPL');
  }));
});
