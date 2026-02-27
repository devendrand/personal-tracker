import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

import { Portfolio } from '../../shared/models/portfolio.model';
import { AddToGroupRequest, LegTypeOption, LinkTransactionsRequest, RemoveFromGroupRequest, RoundTripGroup, RoundTripGroupDetail, StrategyGroup, StrategyGroupCreate, Transaction, TransactionUploadResponse } from '../../shared/models/transaction.model';
import { PnLSummaryResponse } from '../../features/pnl/models/pnl.models';

/**
 * Base API service for making HTTP requests to the backend.
 * 
 * Provides typed methods for common CRUD operations.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * GET request
   */
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`);
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body);
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body);
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body);
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
  }

  /**
   * Upload file via POST
   */
  upload<T>(endpoint: string, file: File): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData);
  }

  getTransactions(params?: { tagged?: boolean; leg_type?: string }): Observable<Transaction[]> {
    const search = new URLSearchParams();
    if (params?.tagged !== undefined) {
      search.set('tagged', String(params.tagged));
    }
    if (params?.leg_type) {
      search.set('leg_type', params.leg_type);
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return this.get<Transaction[]>(`/transactions${suffix}`);
  }

  uploadTransactionsCsv(file: File): Observable<TransactionUploadResponse> {
    return this.upload<TransactionUploadResponse>('/transactions/upload', file);
  }

  getPortfolios(): Observable<Portfolio[]> {
    return this.get<Portfolio[]>('/portfolios');
  }

  getLegTypes(): Observable<LegTypeOption[]> {
    return this.get<LegTypeOption[]>('/transactions/leg-types');
  }

  patchLegType(transactionId: string, legType: string | null): Observable<Transaction> {
    return this.patch<Transaction>(`/transactions/${transactionId}/leg-type`, {
      leg_type: legType
    });
  }

  patchStrategyGroup(transactionId: string, strategyGroupId: string | null): Observable<Transaction> {
    return this.patch<Transaction>(`/transactions/${transactionId}/strategy-group`, {
      strategy_group_id: strategyGroupId
    });
  }

  getStrategyGroups(): Observable<StrategyGroup[]> {
    return this.get<StrategyGroup[]>('/strategy-groups');
  }

  createStrategyGroup(body: StrategyGroupCreate): Observable<StrategyGroup> {
    return this.post<StrategyGroup>('/strategy-groups', body);
  }

  deleteStrategyGroup(groupId: string): Observable<void> {
    return this.delete<void>(`/strategy-groups/${groupId}`);
  }

  getPnL(): Observable<PnLSummaryResponse> {
    return this.get<PnLSummaryResponse>('/pnl');
  }

  getRoundTripGroups(): Observable<RoundTripGroup[]> {
    return this.get<RoundTripGroup[]>('/round-trips');
  }

  getRoundTripGroup(groupId: string): Observable<RoundTripGroupDetail> {
    return this.get<RoundTripGroupDetail>(`/round-trips/${groupId}`);
  }

  linkTransactions(body: LinkTransactionsRequest): Observable<RoundTripGroup> {
    return this.post<RoundTripGroup>('/round-trips/link', body);
  }

  addToRoundTripGroup(groupId: string, body: AddToGroupRequest): Observable<RoundTripGroup> {
    return this.post<RoundTripGroup>(`/round-trips/${groupId}/add`, body);
  }

  removeFromRoundTripGroup(groupId: string, body: RemoveFromGroupRequest): Observable<RoundTripGroup> {
    return this.post<RoundTripGroup>(`/round-trips/${groupId}/remove`, body);
  }

  deleteRoundTripGroup(groupId: string): Observable<void> {
    return this.delete<void>(`/round-trips/${groupId}`);
  }
}
