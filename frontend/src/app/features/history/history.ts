import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import type { CurrentUser } from '../../core/auth/auth.model';
import { AuthService } from '../../core/auth/auth.service';
import type { FileSummary } from '../../core/file/file.model';
import { FileService } from '../../core/file/file.service';
import type { ApiError } from '../../core/http/api-error';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { FileCard } from '../../shared/components/file-card/file-card';
import { FormError } from '../../shared/components/form-error/form-error';
import { FormNotice, type FormNoticeData } from '../../shared/components/form-notice/form-notice';
import { UiButton } from '../../shared/components/ui-button/ui-button';
import { UiCallout } from '../../shared/components/ui-callout/ui-callout';
import { UiSwitch, type UiSwitchValue } from '../../shared/components/ui-switch/ui-switch';

export type HistoryState = 'loading' | 'loaded' | 'empty' | 'error';

/**
 * Écran « Mes fichiers » (US05 historique + US06 suppression). Remplace l'ancien
 * placeholder `features/home`. Accès derrière `authGuard`.
 * `GET /api/me` valide la session (compte supprimé → 401 → déconnexion) et fournit
 * l'email ; `GET /api/files` alimente la liste. Le filtre Tous/Actifs/Expiré est
 * appliqué côté client.
 */
@Component({
  selector: 'app-history',
  imports: [UiButton, UiCallout, UiSwitch, FileCard, ConfirmDialog, FormError, FormNotice],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History {
  private readonly files = inject(FileService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<HistoryState>('loading');
  readonly user = signal<CurrentUser | null>(null);
  readonly items = signal<FileSummary[]>([]);
  readonly filter = signal<UiSwitchValue>('all');
  readonly pendingDelete = signal<FileSummary | null>(null);
  readonly deleting = signal(false);
  readonly serverError = signal<ApiError | null>(null);
  readonly notice = signal<FormNoticeData | null>(null);

  readonly visibleFiles = computed(() => {
    const scope = this.filter();
    if (scope === 'all') {
      return this.items();
    }
    const now = Date.now();
    return this.items().filter((file) => {
      const expired = new Date(file.expiresAt).getTime() <= now;
      return scope === 'expired' ? expired : !expired;
    });
  });

  readonly deleteMessage = computed(() => {
    const file = this.pendingDelete();
    return file ? `« ${file.name} » sera définitivement supprimé.` : '';
  });

  constructor() {
    this.auth
      .me()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => this.user.set(user),
        error: () => this.logout(),
      });

    this.files
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.items.set(list);
          this.state.set(list.length === 0 ? 'empty' : 'loaded');
        },
        error: () => this.state.set('error'),
      });
  }

  copyLink(file: FileSummary): void {
    void navigator.clipboard?.writeText(file.downloadUrl);
  }

  askDelete(file: FileSummary): void {
    this.pendingDelete.set(file);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const file = this.pendingDelete();
    if (!file || this.deleting()) {
      return;
    }
    this.serverError.set(null);
    this.deleting.set(true);
    this.files.remove(file.id).subscribe({
      next: (response) => {
        this.items.update((list) => list.filter((f) => f.id !== file.id));
        this.pendingDelete.set(null);
        this.deleting.set(false);
        this.notice.set({ message: 'Fichier supprimé', status: response.status });
        if (this.items().length === 0) {
          this.state.set('empty');
        }
      },
      error: (err: ApiError) => {
        this.pendingDelete.set(null);
        this.deleting.set(false);
        if (err.status !== 0) {
          this.serverError.set(err);
        }
      },
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
