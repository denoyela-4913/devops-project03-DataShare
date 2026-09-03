import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'datashare.token';

/**
 * Conserve l'access token JWT : signal (source de vérité pour l'appli) + `localStorage`
 * (persistance entre rechargements). Tout accès au stockage est protégé (mode privé, SSR).
 */
@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly current = signal<string | null>(readStorage());

  readonly token = this.current.asReadonly();

  set(token: string): void {
    this.current.set(token);
    writeStorage(token);
  }

  clear(): void {
    this.current.set(null);
    writeStorage(null);
  }
}

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(token: string | null): void {
  try {
    if (token === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, token);
    }
  } catch {
    // stockage indisponible : on garde uniquement l'état en mémoire
  }
}
