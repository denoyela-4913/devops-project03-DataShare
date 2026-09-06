import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import type { CurrentUser } from '../../core/auth/auth.model';
import { AuthService } from '../../core/auth/auth.service';
import type { FileSummary } from '../../core/file/file.model';
import { FileService } from '../../core/file/file.service';
import { History } from './history';

const USER: CurrentUser = { id: 'u1', email: 'alice@example.com' };

function file(over: Partial<FileSummary>): FileSummary {
  return {
    id: 'f1',
    name: 'doc.pdf',
    sizeBytes: 1024,
    createdAt: '2026-01-01T00:00:00Z',
    expiresAt: '2999-01-01T00:00:00Z',
    passwordProtected: false,
    downloadUrl: 'http://x/d/tok1',
    ...over,
  };
}

describe('History (integ)', () => {
  function render(opts?: {
    list?: FileSummary[];
    listError?: boolean;
    me?: ReturnType<AuthService['me']>;
  }) {
    const auth = {
      me: vi.fn().mockReturnValue(opts?.me ?? of(USER)),
      logout: vi.fn(),
    };
    const files = {
      list: vi
        .fn()
        .mockReturnValue(
          opts?.listError ? throwError(() => new Error('500')) : of(opts?.list ?? []),
        ),
      remove: vi.fn().mockReturnValue(of(undefined)),
    };
    TestBed.configureTestingModule({
      imports: [History],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: FileService, useValue: files },
      ],
    });
    // Le constructeur de History peut appeler navigateByUrl (me() en erreur) — spy avant création.
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(History);
    fixture.detectChanges();
    return { fixture, auth, files, navigate };
  }

  const testId = (fixture: ReturnType<typeof render>['fixture'], id: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${id}"]`);

  // happy-dom n'implémente pas showModal/close sur <dialog>.
  const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  const originals = { showModal: proto['showModal'], close: proto['close'] };

  beforeEach(() => {
    proto['showModal'] = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    proto['close'] = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });

  afterEach(() => {
    proto['showModal'] = originals.showModal;
    proto['close'] = originals.close;
    vi.restoreAllMocks();
  });

  it('affiche l’email et l’état vide sans fichier', () => {
    const { fixture } = render({ list: [] });
    expect(testId(fixture, 'history-email')?.textContent).toContain('alice@example.com');
    expect(fixture.componentInstance.state()).toBe('empty');
    expect(testId(fixture, 'history-empty')).not.toBeNull();
  });

  it('liste les fichiers reçus', () => {
    const { fixture } = render({
      list: [file({ id: 'a', name: 'un.pdf' }), file({ id: 'b', name: 'deux.pdf' })],
    });
    expect(fixture.componentInstance.state()).toBe('loaded');
    expect(testId(fixture, 'history-list')?.querySelectorAll('app-file-card')).toHaveLength(2);
  });

  it('affiche l’état erreur si le chargement échoue', () => {
    const { fixture } = render({ listError: true });
    expect(fixture.componentInstance.state()).toBe('error');
    expect(testId(fixture, 'history-error')).not.toBeNull();
  });

  it('filtre Actifs / Expiré côté client', () => {
    const { fixture } = render({
      list: [
        file({ id: 'a', name: 'actif.pdf', expiresAt: '2999-01-01T00:00:00Z' }),
        file({ id: 'b', name: 'vieux.pdf', expiresAt: '2000-01-01T00:00:00Z' }),
      ],
    });
    fixture.componentInstance.filter.set('expired');
    expect(fixture.componentInstance.visibleFiles().map((f) => f.id)).toEqual(['b']);
    fixture.componentInstance.filter.set('active');
    expect(fixture.componentInstance.visibleFiles().map((f) => f.id)).toEqual(['a']);
  });

  it('supprime un fichier après confirmation', () => {
    const { fixture, files } = render({ list: [file({ id: 'a' }), file({ id: 'b' })] });
    fixture.componentInstance.askDelete(file({ id: 'a' }));
    expect(fixture.componentInstance.pendingDelete()?.id).toBe('a');

    fixture.componentInstance.confirmDelete();
    expect(files.remove).toHaveBeenCalledWith('a');
    expect(fixture.componentInstance.items().map((f) => f.id)).toEqual(['b']);
    expect(fixture.componentInstance.pendingDelete()).toBeNull();
  });

  it('repasse en état vide après suppression du dernier fichier', () => {
    const { fixture } = render({ list: [file({ id: 'a' })] });
    fixture.componentInstance.askDelete(file({ id: 'a' }));
    fixture.componentInstance.confirmDelete();
    expect(fixture.componentInstance.state()).toBe('empty');
  });

  it('déconnecte et redirige si /api/me échoue', () => {
    const { auth, navigate } = render({ me: throwError(() => new Error('401')) });
    expect(auth.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('le bouton Se déconnecter appelle logout', () => {
    const { fixture, auth, navigate } = render({ list: [] });
    (testId(fixture, 'history-logout') as HTMLElement).querySelector('button')!.click();
    expect(auth.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
