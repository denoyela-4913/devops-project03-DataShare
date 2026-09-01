import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { AppConfig } from '../../../core/config/app-config';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import type { ApiError } from '../../../core/http/api-error';
import { ErrorNotificationService } from '../../../core/http/error-notification.service';
import { ErrorToast } from './error-toast';

const CONFLICT: ApiError = {
  status: 409,
  code: 'CONFLICT',
  message: 'Erreur de création',
  debug: "L'email aa@gmail.com est déjà utilisé par un autre utilisateur",
};

function render(debugErrors: boolean): {
  fixture: ComponentFixture<ErrorToast>;
  notifier: ErrorNotificationService;
} {
  const config: AppConfig = { production: !debugErrors, apiUrl: '/api', debugErrors };
  TestBed.configureTestingModule({
    imports: [ErrorToast],
    providers: [{ provide: APP_CONFIG, useValue: config }],
  });
  const notifier = TestBed.inject(ErrorNotificationService);
  const fixture = TestBed.createComponent(ErrorToast);
  fixture.detectChanges();
  return { fixture, notifier };
}

function query(fixture: ComponentFixture<unknown>, testId: string): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${testId}"]`);
}

describe('ErrorToast (integ)', () => {
  it('mode debug : affiche le message générique ET le détail technique en info-bulle', () => {
    const { fixture, notifier } = render(true);
    notifier.notify(CONFLICT);
    fixture.detectChanges();

    expect(query(fixture, 'error-message')?.textContent).toContain('Erreur de création');
    const detail = query(fixture, 'error-detail');
    expect(detail).not.toBeNull();
    expect(detail?.getAttribute('title')).toBe(
      "409 CONFLICT — L'email aa@gmail.com est déjà utilisé par un autre utilisateur",
    );
  });

  it('mode prod : affiche le message générique mais PAS le détail technique', () => {
    const { fixture, notifier } = render(false);
    notifier.notify(CONFLICT);
    fixture.detectChanges();

    expect(query(fixture, 'error-message')?.textContent).toContain('Erreur de création');
    expect(query(fixture, 'error-detail')).toBeNull();
  });

  it("rien affiché tant qu'aucune erreur", () => {
    const { fixture } = render(true);
    expect(query(fixture, 'error-toast')).toBeNull();
  });
});
