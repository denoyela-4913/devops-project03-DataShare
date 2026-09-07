import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { FileSummary } from '../../../core/file/file.model';
import { FileCard } from './file-card';

const BASE: FileSummary = {
  id: 'f1',
  name: 'rapport-annuel.pdf',
  sizeBytes: 5 * 1024 * 1024,
  createdAt: '2026-01-01T00:00:00Z',
  expiresAt: '2999-01-01T00:00:00Z',
  passwordProtected: false,
  downloadUrl: 'http://x/d/tok',
};

@Component({
  selector: 'app-file-card-host',
  imports: [FileCard],
  template: '<app-file-card [file]="file()" (remove)="removed = true" />',
})
class FileCardHost {
  readonly file = signal<FileSummary>(BASE);
  removed = false;
}

describe('FileCard', () => {
  function render() {
    TestBed.configureTestingModule({ imports: [FileCardHost] });
    const fixture = TestBed.createComponent(FileCardHost);
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  const testId = (host: HTMLElement, id: string) => host.querySelector(`[data-testid="${id}"]`);

  it('affiche le nom, la taille et l’état actif', () => {
    const { host } = render();
    expect(testId(host, 'file-card-name')?.textContent).toContain('rapport-annuel.pdf');
    expect(testId(host, 'file-card-size')?.textContent).toContain('5');
    expect(testId(host, 'file-card-status')?.textContent).toContain('Actif');
  });

  it('marque un fichier expiré et retire les actions', () => {
    const { fixture, host } = render();
    fixture.componentInstance.file.set({ ...BASE, expiresAt: '2000-01-01T00:00:00Z' });
    fixture.detectChanges();
    expect(testId(host, 'file-card-status')?.textContent).toContain('Expiré');
    expect(host.querySelector('.file-card--expired')).not.toBeNull();
    expect(testId(host, 'file-card-open')).toBeNull();
    expect(testId(host, 'file-card-delete')).toBeNull();
  });

  it('« Accéder » est un lien vers la page de téléchargement, nouvel onglet', () => {
    const { host } = render();
    const link = testId(host, 'file-card-open') as HTMLAnchorElement;
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe(BASE.downloadUrl);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('affiche un badge Protégé quand le fichier a un mot de passe', () => {
    const { fixture, host } = render();
    fixture.componentInstance.file.set({ ...BASE, passwordProtected: true });
    fixture.detectChanges();
    expect(testId(host, 'file-card-locked')).not.toBeNull();
  });

  it('émet (remove) au clic sur Supprimer', () => {
    const { fixture, host } = render();
    (testId(host, 'file-card-delete') as HTMLElement).querySelector('button')!.click();
    expect(fixture.componentInstance.removed).toBe(true);
  });
});
