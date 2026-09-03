import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../config/app-config.token';
import { AuthService } from './auth.service';
import { TokenStore } from './token-store';

function fakeJwt(expOffsetSeconds: number): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expOffsetSeconds }));
  return `header.${payload}.signature`;
}

describe('AuthService (integ)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokens: TokenStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { production: false, apiUrl: '/api', debugErrors: true } },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStore);
  });

  afterEach(() => httpMock.verify());

  it('register poste les identifiants et stocke le token renvoyé', () => {
    let done = false;
    service.register('a@b.com', 'password123').subscribe(() => (done = true));

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'password123' });
    req.flush({ accessToken: 'tok.123', tokenType: 'Bearer', expiresIn: 3600 });

    expect(done).toBe(true);
    expect(tokens.token()).toBe('tok.123');
  });

  it('login stocke le token', () => {
    service.login('a@b.com', 'password123').subscribe();
    httpMock
      .expectOne('/api/auth/login')
      .flush({ accessToken: 'tok.abc', tokenType: 'Bearer', expiresIn: 3600 });
    expect(tokens.token()).toBe('tok.abc');
  });

  it('logout vide le token', () => {
    tokens.set('tok.xyz');
    service.logout();
    expect(tokens.token()).toBeNull();
  });

  it('isAuthenticated : vrai pour un token non expiré, faux sinon', () => {
    expect(service.isAuthenticated()).toBe(false);
    tokens.set(fakeJwt(3600));
    expect(service.isAuthenticated()).toBe(true);
    tokens.set(fakeJwt(-10));
    expect(service.isAuthenticated()).toBe(false);
  });

  it('me() appelle GET /api/me', () => {
    let user: unknown;
    service.me().subscribe((u) => (user = u));
    httpMock.expectOne('/api/me').flush({ id: 'u1', email: 'a@b.com' });
    expect(user).toEqual({ id: 'u1', email: 'a@b.com' });
  });
});
