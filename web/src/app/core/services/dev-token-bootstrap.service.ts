import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

type TokenResponse = {
  access_token: string;
  token_type?: string;
};

@Injectable({
  providedIn: 'root',
})
export class DevTokenBootstrapService {
  constructor(private readonly api: ApiService) {}

  async ensureDevToken(): Promise<void> {
    if (environment.production) {
      return;
    }

    const existing = localStorage.getItem('access_token');
    if (existing) {
      return;
    }

    try {
      const token = await firstValueFrom(this.api.get<TokenResponse>('/auth/dev-token'));
      if (token?.access_token) {
        localStorage.setItem('access_token', token.access_token);
      }
    } catch {
      // Ignore: dev token bootstrap is best-effort.
    }
  }
}
