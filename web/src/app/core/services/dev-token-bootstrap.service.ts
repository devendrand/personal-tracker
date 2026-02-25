import { Injectable, isDevMode } from '@angular/core';

import { environment } from '../../../environments/environment';

interface TokenResponse {
  access_token: string;
  token_type?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DevTokenBootstrapService {
  async ensureDevToken(): Promise<void> {
    if (environment.production || !isDevMode()) {
      return;
    }

    const existing = localStorage.getItem('access_token');
    if (existing) {
      return;
    }

    const candidates = Array.from(
      new Set(
        [
          `${environment.apiUrl.replace(/\/$/, '')}/auth/dev-token`,
          '/api/auth/dev-token',
          'http://localhost:8000/api/auth/dev-token',
        ].filter(Boolean),
      ),
    );

    for (const url of candidates) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!resp.ok) {
          continue;
        }

        const token = (await resp.json()) as TokenResponse;
        if (token?.access_token) {
          localStorage.setItem('access_token', token.access_token);
          return;
        }
      } catch {
        // Ignore and fall through to next candidate
      }
    }
  }
}
