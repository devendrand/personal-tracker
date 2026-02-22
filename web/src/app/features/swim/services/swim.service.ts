import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Swimmer,
  SwimmerCreate,
  SwimEvent,
  SwimMeet,
  SwimMeetCreate,
  SwimTime,
  SwimTimeCreate,
  PRDashboardRow,
  EventProgressionResponse,
  PoolType
} from '../models/swim.model';

@Injectable({
  providedIn: 'root'
})
export class SwimService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/swim';

  // --- Swimmer endpoints ---

  getSwimmers(): Observable<Swimmer[]> {
    return this.http.get<Swimmer[]>(`${this.baseUrl}/swimmers`);
  }

  getSwimmer(id: number): Observable<Swimmer> {
    return this.http.get<Swimmer>(`${this.baseUrl}/swimmers/${id}`);
  }

  createSwimmer(swimmer: SwimmerCreate): Observable<Swimmer> {
    return this.http.post<Swimmer>(`${this.baseUrl}/swimmers`, swimmer);
  }

  updateSwimmer(id: number, swimmer: Partial<SwimmerCreate>): Observable<Swimmer> {
    return this.http.patch<Swimmer>(`${this.baseUrl}/swimmers/${id}`, swimmer);
  }

  deleteSwimmer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/swimmers/${id}`);
  }

  // --- Event endpoints ---

  getEvents(poolType?: PoolType, stroke?: string): Observable<SwimEvent[]> {
    let params = new HttpParams();
    if (poolType) params = params.set('pool_type', poolType);
    if (stroke) params = params.set('stroke', stroke);
    return this.http.get<SwimEvent[]>(`${this.baseUrl}/events`, { params });
  }

  getEvent(id: number): Observable<SwimEvent> {
    return this.http.get<SwimEvent>(`${this.baseUrl}/events/${id}`);
  }

  // --- Meet endpoints ---

  getMeets(year?: number): Observable<SwimMeet[]> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    return this.http.get<SwimMeet[]>(`${this.baseUrl}/meets`, { params });
  }

  createMeet(meet: SwimMeetCreate): Observable<SwimMeet> {
    return this.http.post<SwimMeet>(`${this.baseUrl}/meets`, meet);
  }

  // --- Time endpoints ---

  getTimes(
    swimmerId: number,
    eventId?: number,
    poolType?: PoolType,
    prsOnly?: boolean
  ): Observable<SwimTime[]> {
    let params = new HttpParams();
    if (eventId) params = params.set('event_id', eventId.toString());
    if (poolType) params = params.set('pool_type', poolType);
    if (prsOnly) params = params.set('prs_only', 'true');
    return this.http.get<SwimTime[]>(
      `${this.baseUrl}/swimmers/${swimmerId}/times`,
      { params }
    );
  }

  logTime(swimmerId: number, time: SwimTimeCreate): Observable<SwimTime> {
    return this.http.post<SwimTime>(
      `${this.baseUrl}/swimmers/${swimmerId}/times`,
      time
    );
  }

  updateTime(
    swimmerId: number,
    timeId: number,
    time: Partial<SwimTimeCreate>
  ): Observable<SwimTime> {
    return this.http.patch<SwimTime>(
      `${this.baseUrl}/swimmers/${swimmerId}/times/${timeId}`,
      time
    );
  }

  deleteTime(swimmerId: number, timeId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/swimmers/${swimmerId}/times/${timeId}`
    );
  }

  // --- Report endpoints ---

  getPRDashboard(swimmerId: number, poolType?: PoolType): Observable<PRDashboardRow[]> {
    let params = new HttpParams();
    if (poolType) params = params.set('pool_type', poolType);
    return this.http.get<PRDashboardRow[]>(
      `${this.baseUrl}/swimmers/${swimmerId}/prs`,
      { params }
    );
  }

  getEventProgression(
    swimmerId: number,
    eventId: number,
    poolType: PoolType,
    startDate?: string,
    endDate?: string
  ): Observable<EventProgressionResponse> {
    let params = new HttpParams().set('pool_type', poolType);
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<EventProgressionResponse>(
      `${this.baseUrl}/swimmers/${swimmerId}/progression/${eventId}`,
      { params }
    );
  }
}
