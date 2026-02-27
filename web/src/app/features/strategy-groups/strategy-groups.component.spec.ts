import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { StrategyGroupsComponent } from './strategy-groups.component';
import { StrategyGroup } from '../../shared/models/transaction.model';

const SAMPLE_GROUPS: StrategyGroup[] = [
  { id: 'grp-1', name: 'AAPL Wheel Q1', symbol: 'AAPL', created_at: '2026-01-01T00:00:00Z' },
  { id: 'grp-2', name: 'MSFT Wheel Q1', symbol: 'MSFT', created_at: '2026-01-02T00:00:00Z' }
];

describe('StrategyGroupsComponent', () => {
  let fixture: ComponentFixture<StrategyGroupsComponent>;
  let component: StrategyGroupsComponent;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'getStrategyGroups',
      'createStrategyGroup',
      'deleteStrategyGroup'
    ]);
    api.getStrategyGroups.and.returnValue(of(SAMPLE_GROUPS));

    await TestBed.configureTestingModule({
      imports: [StrategyGroupsComponent, NoopAnimationsModule],
      providers: [{ provide: ApiService, useValue: api }]
    }).compileComponents();

    fixture = TestBed.createComponent(StrategyGroupsComponent);
    component = fixture.componentInstance;
  });

  it('loads strategy groups on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component.groups()).toEqual(SAMPLE_GROUPS);
    expect(component.loading()).toBeFalse();
  }));

  it('renders group names after data loads', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('AAPL Wheel Q1');
    expect(fixture.nativeElement.textContent).toContain('MSFT Wheel Q1');
  }));

  it('shows empty state when no groups exist', fakeAsync(() => {
    api.getStrategyGroups.and.returnValue(of([]));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No strategy groups yet');
  }));

  it('handles load error gracefully', fakeAsync(() => {
    api.getStrategyGroups.and.returnValue(throwError(() => new Error('Network error')));
    fixture.detectChanges();
    tick();
    expect(component.loading()).toBeFalse();
  }));

  it('onCreate does nothing when name or symbol is empty', () => {
    component.newName = '';
    component.newSymbol = 'AAPL';
    component.onCreate();
    expect(api.createStrategyGroup).not.toHaveBeenCalled();
  });

  it('onCreate calls createStrategyGroup with trimmed uppercase symbol', fakeAsync(() => {
    const created: StrategyGroup = { id: 'grp-3', name: 'New Group', symbol: 'TSLA', created_at: '2026-02-01T00:00:00Z' };
    api.createStrategyGroup.and.returnValue(of(created));

    component.newName = 'New Group';
    component.newSymbol = 'tsla';
    component.onCreate();
    tick();

    expect(api.createStrategyGroup).toHaveBeenCalledWith({ name: 'New Group', symbol: 'TSLA' });
    expect(component.newName).toBe('');
    expect(component.newSymbol).toBe('');
    expect(component.creating()).toBeFalse();
  }));

  it('handles create error gracefully', fakeAsync(() => {
    api.createStrategyGroup.and.returnValue(throwError(() => new Error('Server error')));
    component.newName = 'Test';
    component.newSymbol = 'AAPL';
    component.onCreate();
    tick();
    expect(component.creating()).toBeFalse();
  }));

  it('onDelete calls deleteStrategyGroup after confirm', fakeAsync(() => {
    fixture.detectChanges(); // trigger ngOnInit → first loadGroups call
    tick();

    spyOn(window, 'confirm').and.returnValue(true);
    api.deleteStrategyGroup.and.returnValue(of(undefined as unknown as void));

    component.onDelete(SAMPLE_GROUPS[0]);
    tick();

    expect(api.deleteStrategyGroup).toHaveBeenCalledWith('grp-1');
    expect(api.getStrategyGroups).toHaveBeenCalledTimes(2); // init + reload after delete
  }));

  it('onDelete does nothing when user cancels confirm', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.onDelete(SAMPLE_GROUPS[0]);
    expect(api.deleteStrategyGroup).not.toHaveBeenCalled();
  });
});
