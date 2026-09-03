import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Register } from './register';

describe('Register (integ)', () => {
  function setup() {
    const auth = { register: vi.fn().mockReturnValue(of(undefined)) };
    TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    const fixture = TestBed.createComponent(Register);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
    return { fixture, auth, navigate };
  }

  function fill(
    fixture: ReturnType<typeof setup>['fixture'],
    email: string,
    pw: string,
    confirm: string,
  ) {
    const el = fixture.nativeElement as HTMLElement;
    for (const [testId, value] of [
      ['register-email-input', email],
      ['register-password-input', pw],
      ['register-password-confirm-input', confirm],
    ] as const) {
      const input = el.querySelector<HTMLInputElement>(`[data-testid="${testId}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();
  }

  it('mots de passe différents : erreur passwordMismatch sur la confirmation', () => {
    const { fixture } = setup();
    const { form } = fixture.componentInstance;
    form.patchValue({ email: 'a@b.com', password: 'password123', passwordConfirm: 'password999' });
    form.controls.passwordConfirm.updateValueAndValidity();
    form.controls.passwordConfirm.markAsTouched();
    fixture.detectChanges();

    expect(form.controls.passwordConfirm.errors?.['passwordMismatch']).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="register-password-confirm-error"] .field-error',
      )?.textContent,
    ).toContain('correspondent');
  });

  it('formulaire valide : appelle register puis navigue vers /', () => {
    const { fixture, auth, navigate } = setup();
    fill(fixture, 'a@b.com', 'password123', 'password123');
    fixture.componentInstance.submit();
    expect(auth.register).toHaveBeenCalledWith('a@b.com', 'password123');
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('erreur serveur (409) : réactive le bouton', () => {
    const { fixture, auth } = setup();
    auth.register.mockReturnValue(throwError(() => new Error('409')));
    fill(fixture, 'a@b.com', 'password123', 'password123');
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.submitting()).toBe(false);
  });
});
