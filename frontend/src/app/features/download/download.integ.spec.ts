import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import type { ApiError } from '../../core/http/api-error';
import { DownloadService } from '../../core/download/download.service';
import type { FileMetadata } from '../../core/download/download.model';
import { Download } from './download';

const META: FileMetadata = {
  name: 'rapport.pdf',
  sizeBytes: 5 * 1_048_576,
  expiresAt: '2026-01-01T00:00:00Z',
  passwordProtected: false,
};

describe('Download (integ)', () => {
  function render(overrides?: { meta?: Partial<FileMetadata>; metaError?: ApiError }) {
    const downloads = {
      metadata: vi
        .fn()
        .mockReturnValue(
          overrides?.metaError
            ? throwError(() => overrides.metaError)
            : of({ ...META, ...overrides?.meta }),
        ),
      download: vi.fn().mockReturnValue(of(new Blob(['x']))),
    };
    TestBed.configureTestingModule({
      imports: [Download],
      providers: [
        provideRouter([]),
        { provide: DownloadService, useValue: downloads },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ token: 'tok123' }) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(Download);
    fixture.detectChanges();
    return { fixture, downloads };
  }

  const testId = (fixture: ReturnType<typeof render>['fixture'], id: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${id}"]`);

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  it('affiche le fichier quand le lien est valide', () => {
    const { fixture } = render();
    expect(fixture.componentInstance.state()).toBe('ready');
    expect(testId(fixture, 'download-file-name')?.textContent).toContain('rapport.pdf');
    expect(testId(fixture, 'download-file-size')?.textContent).toContain('5.0 Mo');
    expect(testId(fixture, 'download-password-input')).toBeNull();
  });

  it('un lien inconnu (404) affiche l’état introuvable', () => {
    const { fixture } = render({ metaError: { status: 404, code: 'NOT_FOUND', message: 'x' } });
    expect(fixture.componentInstance.state()).toBe('not-found');
    expect(testId(fixture, 'download-not-found')).not.toBeNull();
  });

  it('un lien expiré (410) affiche l’état expiré', () => {
    const { fixture } = render({ metaError: { status: 410, code: 'EXPIRED', message: 'x' } });
    expect(fixture.componentInstance.state()).toBe('expired');
    expect(testId(fixture, 'download-expired')).not.toBeNull();
  });

  it('télécharge un fichier public sans mot de passe', () => {
    const { fixture, downloads } = render();
    fixture.componentInstance.submit();
    expect(downloads.download).toHaveBeenCalledWith('tok123', undefined);
  });

  it('exige le mot de passe pour un fichier protégé', () => {
    const { fixture, downloads } = render({ meta: { passwordProtected: true } });
    fixture.detectChanges();
    fixture.componentInstance.submit();
    expect(downloads.download).not.toHaveBeenCalled();

    fixture.componentInstance.form.controls.password.setValue('secret6');
    fixture.componentInstance.submit();
    expect(downloads.download).toHaveBeenCalledWith('tok123', 'secret6');
  });

  it('une erreur du téléchargement réactive le bouton', () => {
    const { fixture, downloads } = render();
    downloads.download.mockReturnValue(throwError(() => new Error('403')));
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.downloading()).toBe(false);
  });
});
