import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { ApiError } from './api-error';
import { errorInterceptor } from './error.interceptor';
import { ErrorNotificationService } from './error-notification.service';
import { skipErrorNotification } from './http-context';

describe('errorInterceptor (integ)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let notifier: ErrorNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    notifier = TestBed.inject(ErrorNotificationService);
  });

  afterEach(() => httpMock.verify());

  it('mappe un 409 du back en ApiError et le pousse dans le notifier', () => {
    let caught: ApiError | undefined;
    http.get('/api/x').subscribe({ next: () => undefined, error: (e: ApiError) => (caught = e) });

    httpMock.expectOne('/api/x').flush(
      {
        status: 409,
        error: 'Conflict',
        code: 'CONFLICT',
        message: 'Erreur de création',
        path: '/api/x',
        debug: 'email déjà utilisé',
      },
      { status: 409, statusText: 'Conflict' },
    );

    expect(caught).toEqual({
      status: 409,
      code: 'CONFLICT',
      message: 'Erreur de création',
      debug: 'email déjà utilisé',
    });
    expect(notifier.error()).toEqual(caught);
  });

  it('ne pousse pas dans le notifier quand la requête porte SKIP_ERROR_NOTIFICATION', () => {
    let caught: ApiError | undefined;
    http
      .get('/api/silent', { context: skipErrorNotification() })
      .subscribe({ next: () => undefined, error: (e: ApiError) => (caught = e) });

    httpMock.expectOne('/api/silent').flush(
      {
        status: 404,
        error: 'Not Found',
        code: 'NOT_FOUND',
        message: 'Introuvable',
        path: '/api/silent',
      },
      { status: 404, statusText: 'Not Found' },
    );

    expect(caught?.code).toBe('NOT_FOUND');
    expect(notifier.error()).toBeNull();
  });

  it('mappe une panne réseau (status 0) en code NETWORK', () => {
    let caught: ApiError | undefined;
    http.get('/api/y').subscribe({ next: () => undefined, error: (e: ApiError) => (caught = e) });

    httpMock
      .expectOne('/api/y')
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(caught?.code).toBe('NETWORK');
    expect(caught?.status).toBe(0);
  });
});
