import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Login } from './login';

describe('Login (integ)', () => {
  function setup(redirect?: string) {
    const auth = { login: vi.fn().mockReturnValue(of(undefined)) };
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
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

  it('erreur serveur : réactive le bouton', () => {
    const { fixture, auth } = setup();
    auth.login.mockReturnValue(throwError(() => new Error('401')));
    fill(fixture, 'a@b.com', 'secret');
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.submitting()).toBe(false);
  });
});
