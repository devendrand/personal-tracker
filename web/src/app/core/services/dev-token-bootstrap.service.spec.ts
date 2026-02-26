import { TestBed } from '@angular/core/testing';
import { DevTokenBootstrapService } from './dev-token-bootstrap.service';

/** Build a fake JWT with the given payload (no real signature — only exp is checked). */
function makeFakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesig`;
}

const FUTURE_EXP = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
const PAST_EXP = 1; // 1 second after Unix epoch (expired)

const VALID_TOKEN = makeFakeJwt({ sub: 'dev_user', exp: FUTURE_EXP });
const EXPIRED_TOKEN = makeFakeJwt({ sub: 'dev_user', exp: PAST_EXP });
const NEW_TOKEN = 'freshly-fetched-token-xyz';

function mockFetchReturning(token: string): jasmine.Spy {
  return spyOn(globalThis, 'fetch').and.returnValue(
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ access_token: token, token_type: 'bearer' }),
    } as Response),
  );
}

describe('DevTokenBootstrapService', () => {
  let service: DevTokenBootstrapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DevTokenBootstrapService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should skip fetch when valid token exists in localStorage', async () => {
    localStorage.setItem('access_token', VALID_TOKEN);
    const fetchSpy = spyOn(globalThis, 'fetch');

    await service.ensureDevToken();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('access_token')).toBe(VALID_TOKEN);
  });

  it('should fetch new token when localStorage token is expired', async () => {
    localStorage.setItem('access_token', EXPIRED_TOKEN);
    const fetchSpy = mockFetchReturning(NEW_TOKEN);

    await service.ensureDevToken();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should fetch new token when localStorage is empty', async () => {
    const fetchSpy = mockFetchReturning(NEW_TOKEN);

    await service.ensureDevToken();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should clear expired token and store new token after fetching', async () => {
    localStorage.setItem('access_token', EXPIRED_TOKEN);
    mockFetchReturning(NEW_TOKEN);

    await service.ensureDevToken();

    expect(localStorage.getItem('access_token')).toBe(NEW_TOKEN);
  });

  it('should handle malformed token gracefully by clearing it and fetching a new one', async () => {
    localStorage.setItem('access_token', 'not-a-valid-jwt');
    const fetchSpy = mockFetchReturning(NEW_TOKEN);

    await service.ensureDevToken();

    expect(fetchSpy).toHaveBeenCalled();
    expect(localStorage.getItem('access_token')).toBe(NEW_TOKEN);
  });
});
