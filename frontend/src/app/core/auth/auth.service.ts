import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { APP_CONFIG } from '../config/app-config.token';
import type { CurrentUser, TokenResponse } from './auth.model';
import { TokenStore } from './token-store';

/** Inscription (US03), connexion (US04), déconnexion, profil courant. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly tokens = inject(TokenStore);

  /** `true` si un token est présent et non expiré (lecture cliente de `exp`, sans vérif de signature). */
  readonly isAuthenticated = computed(() => {
    const token = this.tokens.token();
    return token !== null && !isExpired(token);
  });

  register(email: string, password: string): Observable<void> {
    return this.authenticate('register', email, password);
  }

  login(email: string, password: string): Observable<void> {
    return this.authenticate('login', email, password);
  }

  logout(): void {
    this.tokens.clear();
  }

  me(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.config.apiUrl}/me`);
  }

  private authenticate(
    path: 'register' | 'login',
    email: string,
    password: string,
  ): Observable<void> {
    return this.http
      .post<TokenResponse>(`${this.config.apiUrl}/auth/${path}`, { email, password })
      .pipe(
        tap((response) => this.tokens.set(response.accessToken)),
        map(() => undefined),
      );
  }
}

function isExpired(token: string): boolean {
  const exp = readExpiry(token);
  return exp === null || exp * 1000 <= Date.now();
}

function readExpiry(token: string): number | null {
  try {
    const segment = (token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(segment)) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}
