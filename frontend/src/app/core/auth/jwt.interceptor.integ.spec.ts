import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../config/app-config.token';
import { jwtInterceptor } from './jwt.interceptor';
import { TokenStore } from './token-store';

describe('jwtInterceptor (integ)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokens: TokenStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { production: false, apiUrl: '/api', debugErrors: true } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStore);
  });

  afterEach(() => httpMock.verify());

  it("ajoute l'en-tête Authorization aux requêtes /api quand un token est présent", () => {
    tokens.set('tok.123');
    http.get('/api/files').subscribe();
    const req = httpMock.expectOne('/api/files');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok.123');
  });

  it("n'ajoute rien sans token", () => {
    http.get('/api/files').subscribe();
    expect(httpMock.expectOne('/api/files').request.headers.has('Authorization')).toBe(false);
  });

  it("n'ajoute rien pour une URL hors API", () => {
    tokens.set('tok.123');
    http.get('https://example.com/data').subscribe();
    expect(
      httpMock.expectOne('https://example.com/data').request.headers.has('Authorization'),
    ).toBe(false);
  });
});
