import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { FormNotice, type FormNoticeData } from './form-notice';

@Component({
  selector: 'app-form-notice-host',
  imports: [FormNotice],
  template: '<app-form-notice [notice]="notice()" [autoDismissMs]="200" />',
})
class FormNoticeHost {
  readonly notice = signal<FormNoticeData | null>(null);
}

describe('FormNotice', () => {
  function render(debugErrors = false) {
    TestBed.configureTestingModule({
      imports: [FormNoticeHost],
      providers: [
        {
          provide: APP_CONFIG,
          useValue: { production: !debugErrors, apiUrl: '/api', debugErrors },
        },
      ],
    });
    const fixture = TestBed.createComponent(FormNoticeHost);
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  const msg = (host: HTMLElement) =>
    host.querySelector('[data-testid="form-notice-message"]')?.textContent?.trim();

  it('ne rend rien sans notice', () => {
    const { host } = render();
    expect(host.querySelector('[data-testid="form-notice"]')).toBeNull();
  });

  it('affiche le message simple hors mode debug', () => {
    const { fixture, host } = render(false);
    fixture.componentInstance.notice.set({ message: 'Fichier supprimé', status: 204 });
    fixture.detectChanges();
    expect(msg(host)).toBe('Fichier supprimé');
  });

  it('préfixe par le code HTTP en mode debug', () => {
    const { fixture, host } = render(true);
    fixture.componentInstance.notice.set({ message: 'Fichier supprimé', status: 204 });
    fixture.detectChanges();
    expect(msg(host)).toBe('204 No Content · Fichier supprimé');
  });

  it('disparaît seul après autoDismissMs', () => {
    vi.useFakeTimers();
    try {
      const { fixture, host } = render(false);
      fixture.componentInstance.notice.set({ message: 'Fichier supprimé' });
      fixture.detectChanges();
      expect(host.querySelector('[data-testid="form-notice"]')).not.toBeNull();

      vi.advanceTimersByTime(250);
      fixture.detectChanges();
      expect(host.querySelector('[data-testid="form-notice"]')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
