import { ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Login } from './login';

describe('Login', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule],
      providers: [provideRouter([])],
    }),
  );

  it('se crée avec un formulaire email/mot de passe invalide par défaut', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('rend les champs et le bouton de soumission', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="login-email-input"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="login-password-input"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="login-submit"]')).not.toBeNull();
  });

  it('ne soumet pas et marque les champs comme touchés si le formulaire est invalide', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.form.get('email')?.touched).toBe(true);
  });
});
