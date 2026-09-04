import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../config/app-config.token';
import { FileService } from './file.service';

describe('FileService (integ)', () => {
  let service: FileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { production: false, apiUrl: '/api', debugErrors: true } },
      ],
    });
    service = TestBed.inject(FileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('poste un FormData avec le fichier, expirationDays et le mot de passe optionnel', () => {
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    let response: unknown;
    service
      .upload(file, { expirationDays: 3, password: 'secret6' })
      .subscribe((r) => (response = r));

    const req = httpMock.expectOne('/api/files');
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.get('file')).toBeInstanceOf(File);
    expect(body.get('expirationDays')).toBe('3');
    expect(body.get('password')).toBe('secret6');

    req.flush({
      downloadUrl: 'http://x/d/tok',
      token: 'tok',
      name: 'doc.pdf',
      sizeBytes: 4,
      expiresAt: '2026-01-01',
    });
    expect(response).toMatchObject({ token: 'tok' });
  });

  it("n'ajoute pas le champ password quand il est absent", () => {
    service.upload(new File(['x'], 'a.txt'), { expirationDays: 7 }).subscribe();
    const body = httpMock.expectOne('/api/files').request.body as FormData;
    expect(body.has('password')).toBe(false);
  });
});
