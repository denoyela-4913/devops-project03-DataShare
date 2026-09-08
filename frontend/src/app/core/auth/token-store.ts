import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'datashare.token';

/**
 * Conserve l'access token JWT : signal (source de vérité pour l'appli) + `sessionStorage`
 * (persistance sur rechargement, mais **propre à l'onglet**).
 *
 * Le choix de `sessionStorage` plutôt que `localStorage` est délibéré : un nouvel onglet —
 * lien de partage ouvert depuis l'historique (`target="_blank" rel="noopener"`), ou onglet
 * ouvert à la main — démarre avec un stockage vierge, donc déconnecté. La page `/d/:token`
 * n'hérite jamais de la session d'un compte, et ouvrir `/history` dans un onglet neuf ne
 * donne pas accès à l'espace de qui que ce soit sans se reconnecter.
 *
 * Tout accès au stockage est protégé (mode privé, SSR).
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
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(token: string | null): void {
  try {
    if (token === null) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, token);
    }
  } catch {
    // stockage indisponible : on garde uniquement l'état en mémoire
  }
}
