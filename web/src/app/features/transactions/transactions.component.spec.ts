import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { Transaction } from '../../shared/models/transaction.model';
import { TransactionsComponent } from './transactions.component';

describe('TransactionsComponent (strategy type tagging)', () => {
  let fixture: ComponentFixture<TransactionsComponent>;
  let component: TransactionsComponent;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'getTransactions',
      'getStrategyTypes',
      'setTransactionStrategyType',
      'uploadTransactionsCsv'
    ]);

    api.getStrategyTypes.and.returnValue(
      of([
        {
          value: 'WHEEL',
          label: 'Wheel',
          description: 'Sell CSPs, take assignment, then sell covered calls.'
        }
      ])
    );

    api.getTransactions.and.returnValue(
      of([
        {
          id: 't1',
          activity_date: '2026-01-15',
          activity_type: 'BUY',
          description: 'Test transaction',
          symbol: 'AAPL',
          quantity: 1,
          price: 100,
          amount: 100,
          strategy_type: null,
          created_at: '2026-01-15T00:00:00Z'
        }
      ])
    );

    const taggedTransaction: Transaction = {
      id: 't1',
      activity_date: '2026-01-15',
      activity_type: 'BUY',
      description: 'Test transaction',
      symbol: 'AAPL',
      quantity: 1,
      price: 100,
      amount: 100,
      strategy_type: 'WHEEL',
      created_at: '2026-01-15T00:00:00Z'
    };

    api.setTransactionStrategyType.and.returnValue(of(taggedTransaction));

    await TestBed.configureTestingModule({
      imports: [TransactionsComponent, NoopAnimationsModule],
      providers: [{ provide: ApiService, useValue: api }]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionsComponent);
    component = fixture.componentInstance;
  });

  it('renders a portfolio mat-select when portfolios exist', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const selectDebug = fixture.debugElement.query(By.css('mat-select'));
    expect(selectDebug).withContext('Expected a mat-select for Strategy Type').toBeTruthy();
  }));

  it('renders an "Untagged" filter toggle', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Untagged');
  }));

  it('passes tagged=false when filtering to untagged', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.onFilterChanged('unassigned');

    expect(api.getTransactions).toHaveBeenCalledWith(
      jasmine.objectContaining({ tagged: false })
    );
  }));

  it('passes strategy_type when selecting a strategy filter', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.onStrategyFilterSelected('WHEEL');

    expect(api.getTransactions).toHaveBeenCalledWith(
      jasmine.objectContaining({ strategy_type: 'WHEEL' })
    );
  }));

  it('calls ApiService.setTransactionStrategyType when a strategy type is selected', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const tx = component.transactions[0];
    component.onStrategyTypeSelected(tx, 'WHEEL');

    expect(api.setTransactionStrategyType).toHaveBeenCalledWith('t1', 'WHEEL');
  }));
});
