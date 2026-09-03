import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Home } from './home';

describe('Home (integ)', () => {
  function setup(meResult: ReturnType<AuthService['me']>) {
    const auth = { me: () => meResult, logout: vi.fn() };
    const navigateByUrl = vi.fn();
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    return { fixture, auth, navigateByUrl };
  }

  it("affiche l'email retourné par /api/me", () => {
    const { fixture } = setup(of({ id: 'u1', email: 'alice@example.com' }));
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="home-email"]')
        ?.textContent,
    ).toContain('alice@example.com');
  });

  it('déconnecte et redirige si /api/me échoue', () => {
    const { auth, navigateByUrl } = setup(throwError(() => new Error('401')));
    expect(auth.logout).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('le bouton de déconnexion appelle logout et redirige', () => {
    const { fixture, auth, navigateByUrl } = setup(of({ id: 'u1', email: 'a@b.com' }));
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="home-logout"]')!
      .click();
    expect(auth.logout).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
