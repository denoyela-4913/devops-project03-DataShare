import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { Login } from './login';

const CONFIG = { production: true, apiUrl: '/api', debugErrors: false };

describe('Login (integ)', () => {
  function setup(redirect?: string) {
    const auth = { login: vi.fn().mockReturnValue(of(undefined)) };
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: APP_CONFIG, useValue: CONFIG },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(redirect ? { redirect } : {}) },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(Login);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
    return { fixture, auth, navigate };
  }

  function fill(fixture: ReturnType<typeof setup>['fixture'], email: string, password: string) {
    const el = fixture.nativeElement as HTMLElement;
    for (const [testId, value] of [
      ['login-email-input', email],
      ['login-password-input', password],
    ] as const) {
      const input = el.querySelector<HTMLInputElement>(`[data-testid="${testId}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();
  }

  it('formulaire invalide : ne soumet pas, affiche les erreurs', () => {
    const { fixture, auth } = setup();
    fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(auth.login).not.toHaveBeenCalled();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="login-email-error"] .field-error',
      ),
    ).not.toBeNull();
  });

  it('formulaire valide : appelle AuthService.login puis navigue', () => {
    const { fixture, auth, navigate } = setup();
    fill(fixture, 'a@b.com', 'secret');
    fixture.componentInstance.submit();
    expect(auth.login).toHaveBeenCalledWith('a@b.com', 'secret');
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('honore le paramètre redirect', () => {
    const { fixture, navigate } = setup('/history');
    fill(fixture, 'a@b.com', 'secret');
    fixture.componentInstance.submit();
    expect(navigate).toHaveBeenCalledWith('/history');
  });

  it('erreur serveur : réactive le bouton et affiche le bandeau dans la carte', () => {
    const { fixture, auth } = setup();
    auth.login.mockReturnValue(
      throwError(() => ({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Identifiants refusés.',
      })),
    );
    fill(fixture, 'a@b.com', 'secret');
    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.componentInstance.submitting()).toBe(false);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="form-error-message"]')?.textContent).toContain(
      'Identifiants refusés.',
    );
  });

  it('panne réseau : ne montre pas de bandeau dans la carte (filet global)', () => {
    const { fixture, auth } = setup();
    auth.login.mockReturnValue(
      throwError(() => ({ status: 0, code: 'NETWORK', message: 'Hors ligne.' })),
    );
    fill(fixture, 'a@b.com', 'secret');
    fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="form-error"]'),
    ).toBeNull();
  });
});
