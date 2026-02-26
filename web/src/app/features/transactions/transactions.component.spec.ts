import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { Transaction } from '../../shared/models/transaction.model';
import { TransactionsComponent } from './transactions.component';

describe('TransactionsComponent (portfolio tagging)', () => {
  let fixture: ComponentFixture<TransactionsComponent>;
  let component: TransactionsComponent;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'getPortfolios',
      'getTransactions',
      'tagTransaction',
      'uploadTransactionsCsv'
    ]);

    api.getPortfolios.and.returnValue(
      of([
        {
          id: 'p1',
          name: 'Long Term',
          created_at: '2026-01-01T00:00:00Z'
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
          portfolio_id: null,
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
      portfolio_id: 'p1',
      created_at: '2026-01-15T00:00:00Z'
    };

    api.tagTransaction.and.returnValue(of(taggedTransaction));

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
    expect(selectDebug).withContext('Expected a mat-select in the Portfolio column').toBeTruthy();
  }));

  it('calls ApiService.tagTransaction when a portfolio is selected', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const tx = component.transactions[0];
    component.onPortfolioSelected(tx, 'p1');

    expect(api.tagTransaction).toHaveBeenCalledWith('t1', 'p1');
  }));
});
