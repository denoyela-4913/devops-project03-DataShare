import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { Register } from './register';

describe('Register', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [Register, ReactiveFormsModule],
      providers: [provideRouter([])],
    }),
  );

  it('se crée avec un formulaire invalide par défaut', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('rend les 3 champs et le bouton de soumission', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="register-email-input"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="register-password-input"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="register-password-confirm-input"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="register-submit"]')).not.toBeNull();
  });

  it('signale une erreur si les mots de passe ne correspondent pas', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    const { form } = fixture.componentInstance;
    form.setValue({
      email: 'a@example.com',
      password: 'password123',
      passwordConfirm: 'different123',
    });
    expect(form.errors?.['passwordMismatch']).toBe(true);
  });
});
