import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../config/app-config.token';
import { DownloadService } from './download.service';

describe('DownloadService (integ)', () => {
  let service: DownloadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { production: false, apiUrl: '/api', debugErrors: true } },
      ],
    });
    service = TestBed.inject(DownloadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('metadata() fait un GET /api/d/{token}', () => {
    let response: unknown;
    service.metadata('tok123').subscribe((r) => (response = r));

    const req = httpMock.expectOne('/api/d/tok123');
    expect(req.request.method).toBe('GET');

    const body = { name: 'a.pdf', sizeBytes: 4, expiresAt: '2026-01-01', passwordProtected: false };
    req.flush(body);
    expect(response).toEqual(body);
  });

  it('encode le token dans l’URL', () => {
    service.metadata('a/b c').subscribe();
    const req = httpMock.expectOne('/api/d/a%2Fb%20c');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('download() poste le mot de passe et attend un blob', () => {
    let blob: Blob | undefined;
    service.download('tok', 'secret6').subscribe((b) => (blob = b));

    const req = httpMock.expectOne('/api/d/tok');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ password: 'secret6' });
    expect(req.request.responseType).toBe('blob');

    req.flush(new Blob(['x']));
    expect(blob).toBeInstanceOf(Blob);
  });

  it('download() sans mot de passe envoie password: null', () => {
    service.download('tok').subscribe();
    const req = httpMock.expectOne('/api/d/tok');
    expect(req.request.body).toEqual({ password: null });
    req.flush(new Blob(['x']));
  });
});
