import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { TokenStore } from './core/auth/token-store';
import { APP_CONFIG } from './core/config/app-config.token';

@Component({ template: '' })
class Stub {}

function fakeJwt(expOffsetSeconds: number): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expOffsetSeconds }));
  return `header.${payload}.signature`;
}

describe('App', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', component: Stub },
          { path: 'login', component: Stub },
          { path: 'd/:token', component: Stub },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { production: false, apiUrl: '/api', debugErrors: true } },
      ],
    });
  });

  const headerLink = (host: HTMLElement) =>
    host.querySelector('[data-testid="app-header-login-link"]');

  it("se crée et rend le router-outlet + le bandeau d'erreur", () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('router-outlet')).not.toBeNull();
    expect(el.querySelector('app-error-toast')).not.toBeNull();
    expect(el.querySelector('.skip-link')).not.toBeNull();
  });

  it('en-tête : « Mon espace » quand une session est ouverte', async () => {
    TestBed.inject(TokenStore).set(fakeJwt(3600));
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigate(['/']);
    fixture.detectChanges();

    expect(headerLink(fixture.nativeElement)?.textContent).toContain('Mon espace');
  });

  it('en-tête : « Se connecter » sur un lien de partage /d/:token même avec une session ouverte', async () => {
    TestBed.inject(TokenStore).set(fakeJwt(3600));
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigate(['/d/tok123']);
    fixture.detectChanges();

    const link = headerLink(fixture.nativeElement);
    expect(link?.textContent).toContain('Se connecter');
    expect(link?.getAttribute('href')).toContain('/login');
  });
});
