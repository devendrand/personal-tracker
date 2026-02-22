import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
}
