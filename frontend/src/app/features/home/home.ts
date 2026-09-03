import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import type { CurrentUser } from '../../core/auth/auth.model';

/**
 * Espace personnel — placeholder d'atterrissage après connexion. Sera remplacé par
 * l'historique (US05). Vérifie le token via `GET /api/me`.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = signal<CurrentUser | null>(null);

  constructor() {
    this.auth
      .me()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (user) => this.user.set(user),
        error: () => this.logout(),
      });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
