import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import type { ApiError } from '../../../core/http/api-error';
import { FormError } from './form-error';

@Component({
  selector: 'app-form-error-host',
  imports: [FormError],
  template: '<app-form-error [error]="error()" />',
})
class FormErrorHost {
  readonly error = signal<ApiError | null>(null);
}

const ERR: ApiError = {
  status: 401,
  code: 'INVALID_CREDENTIALS',
  message: 'E-mail ou mot de passe incorrect.',
  debug: 'bad credentials for a@b.com',
};

describe('FormError', () => {
  function render(debugErrors: boolean) {
    TestBed.configureTestingModule({
      imports: [FormErrorHost],
      providers: [
        {
          provide: APP_CONFIG,
          useValue: { production: !debugErrors, apiUrl: '/api', debugErrors },
        },
      ],
    });
    const fixture = TestBed.createComponent(FormErrorHost);
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  const testId = (host: HTMLElement, id: string) => host.querySelector(`[data-testid="${id}"]`);

  it("ne rend rien tant qu'il n'y a pas d'erreur", () => {
    const { host } = render(false);
    expect(testId(host, 'form-error')).toBeNull();
  });

  it('affiche le message et porte role=alert', () => {
    const { fixture, host } = render(false);
    fixture.componentInstance.error.set(ERR);
    fixture.detectChanges();
    const box = testId(host, 'form-error')!;
    expect(box.getAttribute('role')).toBe('alert');
    expect(testId(host, 'form-error-message')?.textContent).toContain('mot de passe incorrect');
  });

  it('masque le détail technique hors mode debug', () => {
    const { fixture, host } = render(false);
    fixture.componentInstance.error.set(ERR);
    fixture.detectChanges();
    expect(testId(host, 'form-error-debug')).toBeNull();
  });

  it('affiche le détail technique en mode debug', () => {
    const { fixture, host } = render(true);
    fixture.componentInstance.error.set(ERR);
    fixture.detectChanges();
    expect(testId(host, 'form-error-debug')?.textContent).toContain(
      '401 INVALID_CREDENTIALS — bad credentials',
    );
  });

  it("pas de détail si le back n'a rien renvoyé, même en debug", () => {
    const { fixture, host } = render(true);
    fixture.componentInstance.error.set({ status: 0, code: 'NETWORK', message: 'Hors ligne.' });
    fixture.detectChanges();
    expect(testId(host, 'form-error-debug')).toBeNull();
  });
});
