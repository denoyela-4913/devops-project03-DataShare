import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  function run(authenticated: boolean, url = '/history') {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { isAuthenticated: () => authenticated } }],
    });
    const state = { url } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, state));
  }

  it('laisse passer un utilisateur authentifié', () => {
    expect(run(true)).toBe(true);
  });

  it('redirige vers /login avec le paramètre redirect sinon', () => {
    const result = run(false, '/history');
    expect(result).toBeInstanceOf(UrlTree);
    const tree = result as UrlTree;
    const expected = TestBed.inject(Router).createUrlTree(['/login'], {
      queryParams: { redirect: '/history' },
    });
    expect(tree.toString()).toBe(expected.toString());
  });
});
