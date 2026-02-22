import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  NWAccount,
  NWAccountCreate,
  NWSnapshot,
  NWSnapshotCreate,
  NWSnapshotSummary,
  NetWorthSummary,
  NetWorthTrendResponse,
  CategoryBreakdown,
  AccountType
} from '../models/networth.model';

@Injectable({
  providedIn: 'root'
})
export class NetWorthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/networth';

  // --- Account endpoints ---

  getAccounts(
    accountType?: AccountType,
    category?: string,
    activeOnly = true
  ): Observable<NWAccount[]> {
    let params = new HttpParams();
    if (accountType) params = params.set('account_type', accountType);
    if (category) params = params.set('category', category);
    params = params.set('active_only', activeOnly.toString());
    return this.http.get<NWAccount[]>(`${this.baseUrl}/accounts`, { params });
  }

  getAccount(id: number): Observable<NWAccount> {
    return this.http.get<NWAccount>(`${this.baseUrl}/accounts/${id}`);
  }

  createAccount(account: NWAccountCreate): Observable<NWAccount> {
    return this.http.post<NWAccount>(`${this.baseUrl}/accounts`, account);
  }

  updateAccount(id: number, account: Partial<NWAccountCreate>): Observable<NWAccount> {
    return this.http.patch<NWAccount>(`${this.baseUrl}/accounts/${id}`, account);
  }

  deleteAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/accounts/${id}`);
  }

  // --- Snapshot endpoints ---

  getSnapshots(year?: number, limit = 52): Observable<NWSnapshotSummary[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (year) params = params.set('year', year.toString());
    return this.http.get<NWSnapshotSummary[]>(`${this.baseUrl}/snapshots`, { params });
  }

  getSnapshot(id: number): Observable<NWSnapshot> {
    return this.http.get<NWSnapshot>(`${this.baseUrl}/snapshots/${id}`);
  }

  getLatestSnapshot(): Observable<NWSnapshot> {
    return this.http.get<NWSnapshot>(`${this.baseUrl}/snapshots/latest`);
  }

  createSnapshot(snapshot: NWSnapshotCreate): Observable<NWSnapshot> {
    return this.http.post<NWSnapshot>(`${this.baseUrl}/snapshots`, snapshot);
  }

  updateSnapshot(id: number, snapshot: Partial<NWSnapshotCreate>): Observable<NWSnapshot> {
    return this.http.patch<NWSnapshot>(`${this.baseUrl}/snapshots/${id}`, snapshot);
  }

  deleteSnapshot(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/snapshots/${id}`);
  }

  getSnapshotPrefill(): Observable<{ accountId: number; name: string; lastBalance: number }[]> {
    return this.http.get<{ accountId: number; name: string; lastBalance: number }[]>(
      `${this.baseUrl}/snapshots/prefill`
    );
  }

  // --- Report endpoints ---

  getSummary(): Observable<NetWorthSummary> {
    return this.http.get<NetWorthSummary>(`${this.baseUrl}/summary`);
  }

  getTrend(
    period = '1y',
    startDate?: string,
    endDate?: string
  ): Observable<NetWorthTrendResponse> {
    let params = new HttpParams().set('period', period);
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<NetWorthTrendResponse>(`${this.baseUrl}/trend`, { params });
  }

  getAssetsBreakdown(): Observable<CategoryBreakdown[]> {
    return this.http.get<CategoryBreakdown[]>(`${this.baseUrl}/breakdown/assets`);
  }

  getLiabilitiesBreakdown(): Observable<CategoryBreakdown[]> {
    return this.http.get<CategoryBreakdown[]>(`${this.baseUrl}/breakdown/liabilities`);
  }
}
