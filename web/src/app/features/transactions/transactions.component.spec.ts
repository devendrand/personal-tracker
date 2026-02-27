import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { Transaction } from '../../shared/models/transaction.model';
import { TransactionsComponent } from './transactions.component';

describe('TransactionsComponent (leg type tagging)', () => {
  let fixture: ComponentFixture<TransactionsComponent>;
  let component: TransactionsComponent;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'getTransactions',
      'getLegTypes',
      'patchLegType',
      'getStrategyGroups',
      'uploadTransactionsCsv'
    ]);

    api.getLegTypes.and.returnValue(
      of([
        { value: 'CSP', label: 'CSP', description: 'Cash-Secured Put' },
        { value: 'CC',  label: 'CC',  description: 'Covered Call' },
        { value: 'BUY', label: 'BUY', description: 'Stock purchase' },
        { value: 'SELL', label: 'SELL', description: 'Stock sale' }
      ])
    );

    api.getTransactions.and.returnValue(
      of([
        {
          id: 't1',
          activity_date: '2026-01-15',
          activity_type: 'Sold Short',
          description: 'PUT AAPL 02/27/26 180.000',
          symbol: 'AAPL',
          quantity: 1,
          price: 1.50,
          amount: 150,
          leg_type: null,
          strategy_group_id: null,
          created_at: '2026-01-15T00:00:00Z'
        }
      ])
    );

    api.getStrategyGroups.and.returnValue(of([]));

    const taggedTransaction: Transaction = {
      id: 't1',
      activity_date: '2026-01-15',
      activity_type: 'Sold Short',
      description: 'PUT AAPL 02/27/26 180.000',
      symbol: 'AAPL',
      quantity: 1,
      price: 1.50,
      amount: 150,
      leg_type: 'CSP',
      strategy_group_id: null,
      created_at: '2026-01-15T00:00:00Z'
    };

    api.patchLegType.and.returnValue(of(taggedTransaction));

    await TestBed.configureTestingModule({
      imports: [TransactionsComponent, NoopAnimationsModule],
      providers: [{ provide: ApiService, useValue: api }]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionsComponent);
    component = fixture.componentInstance;
  });

  it('renders a mat-select when leg type options exist', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const selectDebug = fixture.debugElement.query(By.css('mat-select'));
    expect(selectDebug).withContext('Expected a mat-select for Leg Type filter').toBeTruthy();
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

    component.onFilterChanged('untagged');

    expect(api.getTransactions).toHaveBeenCalledWith(
      jasmine.objectContaining({ tagged: false })
    );
  }));

  it('passes leg_type when selecting a leg type filter', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.onLegTypeFilterSelected('CSP');

    expect(api.getTransactions).toHaveBeenCalledWith(
      jasmine.objectContaining({ leg_type: 'CSP' })
    );
  }));

  it('calls ApiService.patchLegType when a leg type is selected', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const tx = component.transactions[0];
    component.onLegTypeSelected(tx, 'CSP');

    expect(api.patchLegType).toHaveBeenCalledWith('t1', 'CSP');
  }));
});
