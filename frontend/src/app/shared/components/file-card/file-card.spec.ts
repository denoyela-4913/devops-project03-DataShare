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

  it('affiche le nom et le libellé d’expiration (sans la taille)', () => {
    const { host } = render();
    expect(testId(host, 'file-card-name')?.textContent).toContain('rapport-annuel.pdf');
    expect(testId(host, 'file-card-size')).toBeNull();
    expect(testId(host, 'file-card-status')?.textContent).toContain('Expire dans');
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

  describe('menu « ⋮ » (mobile)', () => {
    const menu = (host: HTMLElement) => testId(host, 'file-card-menu') as HTMLButtonElement;
    const panel = (host: HTMLElement) => testId(host, 'file-card-actions') as HTMLElement;

    it('expose un bouton nommé, replié par défaut, relié au panneau des actions', () => {
      const { host } = render();
      expect(menu(host).getAttribute('aria-label')).toBe('Actions pour rapport-annuel.pdf');
      expect(menu(host).getAttribute('aria-expanded')).toBe('false');
      expect(menu(host).getAttribute('aria-controls')).toBe(panel(host).id);
      expect(panel(host).classList).not.toContain('file-card__actions--open');
    });

    it('n’existe pas sur un fichier expiré', () => {
      const { fixture, host } = render();
      fixture.componentInstance.file.set({ ...BASE, expiresAt: '2000-01-01T00:00:00Z' });
      fixture.detectChanges();
      expect(testId(host, 'file-card-menu')).toBeNull();
    });

    it('s’ouvre et se referme au clic sur « ⋮ »', () => {
      const { fixture, host } = render();
      menu(host).click();
      fixture.detectChanges();
      expect(menu(host).getAttribute('aria-expanded')).toBe('true');
      expect(panel(host).classList).toContain('file-card__actions--open');
      menu(host).click();
      fixture.detectChanges();
      expect(menu(host).getAttribute('aria-expanded')).toBe('false');
    });

    it('se ferme avec Échap et rend le focus au bouton « ⋮ »', () => {
      const { fixture, host } = render();
      document.body.appendChild(host);
      menu(host).click();
      fixture.detectChanges();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(menu(host).getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(menu(host));
      host.remove();
    });

    it('se ferme au clic en dehors de la carte', () => {
      const { fixture, host } = render();
      menu(host).click();
      fixture.detectChanges();
      document.body.click();
      fixture.detectChanges();
      expect(menu(host).getAttribute('aria-expanded')).toBe('false');
    });

    it('se ferme quand le focus quitte la carte', () => {
      const { fixture, host } = render();
      menu(host).click();
      fixture.detectChanges();
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      menu(host).dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }),
      );
      fixture.detectChanges();
      expect(menu(host).getAttribute('aria-expanded')).toBe('false');
      outside.remove();
    });

    it('reste ouvert quand le focus passe à une action du panneau', () => {
      const { fixture, host } = render();
      menu(host).click();
      fixture.detectChanges();
      const open = testId(host, 'file-card-open') as HTMLElement;
      menu(host).dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: open }));
      fixture.detectChanges();
      expect(menu(host).getAttribute('aria-expanded')).toBe('true');
    });

    it('se ferme après « Supprimer » (et émet remove)', () => {
      const { fixture, host } = render();
      menu(host).click();
      fixture.detectChanges();
      (testId(host, 'file-card-delete') as HTMLElement).querySelector('button')!.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.removed).toBe(true);
      expect(menu(host).getAttribute('aria-expanded')).toBe('false');
    });
  });
});
