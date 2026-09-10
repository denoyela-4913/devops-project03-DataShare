import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import type { FileMetadata } from '../../core/download/download.model';
import { DownloadService } from '../../core/download/download.service';
import type { ApiError } from '../../core/http/api-error';
import { FieldError } from '../../shared/components/field-error/field-error';
import { FormError } from '../../shared/components/form-error/form-error';
import { UiButton } from '../../shared/components/ui-button/ui-button';
import { UiCallout, type UiCalloutType } from '../../shared/components/ui-callout/ui-callout';
import { UiInput } from '../../shared/components/ui-input/ui-input';

export type DownloadState = 'loading' | 'ready' | 'not-found' | 'expired';

/**
 * Écran de téléchargement d'un lien de partage (US02). Accès anonyme.
 * Un mot de passe faux (403) ou une autre erreur du POST s'affiche dans la carte via
 * `<app-form-error>` ; un lien 404/410 est un état de page.
 */
@Component({
  selector: 'app-download',
  imports: [ReactiveFormsModule, FieldError, FormError, UiButton, UiCallout, UiInput],
  templateUrl: './download.html',
  styleUrl: './download.scss',
})
export class Download {
  private readonly route = inject(ActivatedRoute);
  private readonly downloads = inject(DownloadService);
  private readonly fb = inject(FormBuilder);

  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  readonly state = signal<DownloadState>('loading');
  readonly metadata = signal<FileMetadata | null>(null);
  readonly downloading = signal(false);
  readonly serverError = signal<ApiError | null>(null);

  readonly form = this.fb.nonNullable.group({
    password: ['', Validators.required],
  });

  readonly sizeLabel = computed(() => {
    const mb = (this.metadata()?.sizeBytes ?? 0) / 1_048_576;
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} Go` : `${mb.toFixed(1)} Mo`;
  });

  /**
   * Libellé et type du bandeau d'expiration (`data-testid="download-expiry"`).
   * Le décompte se fait en jours du calendrier (minuit à minuit), pas en tranches de 24 h.
   * - expire aujourd'hui  → « aujourd'hui », alerte (cas absent de Figma, ajouté)
   * - expire demain       → « demain », alerte
   * - au-delà             → « dans N jours », info
   * `null` (bandeau masqué) sans métadonnée ou si la date est déjà passée — ce dernier
   * cas correspond déjà à l'état de page `expired`.
   */
  readonly expiry = computed<{ label: string; tone: UiCalloutType } | null>(() => {
    const meta = this.metadata();
    if (!meta) {
      return null;
    }
    const remainingMs = new Date(meta.expiresAt).getTime() - Date.now();
    // Le fichier est expiré => on ne montre pas de bandeau, l'état de page est déjà `expired`.
    if (remainingMs <= 0) {
      return null;
    }
    // Comparaison de dates « nues » (sans l'heure) : combien de minuits séparent
    // aujourd'hui du jour d'expiration ?
    const startOfDay = (d: Date): number => {
      const copy = new Date(d);
      copy.setHours(0, 0, 0, 0);
      return copy.getTime();
    };

    // Math.round (et non ceil/floor) : les jours de changement d'heure durent 23 h
    // ou 25 h, la division ne tombe alors pas pile sur un entier.
    const days = Math.round(
      (startOfDay(new Date(meta.expiresAt)) - startOfDay(new Date())) / 86_400_000,
    );

    // days >= 0 ici (remainingMs > 0 => expiration dans le futur).
    if (days === 0) {
      return { label: "Ce fichier expirera aujourd'hui.", tone: 'alert' };
    }
    if (days === 1) {
      return { label: 'Ce fichier expirera demain.', tone: 'alert' };
    }
    return { label: `Ce fichier expirera dans ${days} jours.`, tone: 'info' };
  });

  constructor() {
    this.downloads
      .metadata(this.token)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (meta) => {
          this.metadata.set(meta);
          this.state.set('ready');
        },
        error: (err: ApiError) => this.state.set(err.status === 410 ? 'expired' : 'not-found'),
      });
  }

  submit(): void {
    const meta = this.metadata();
    if (!meta || this.downloading()) {
      return;
    }
    if (meta.passwordProtected && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.serverError.set(null);
    this.downloading.set(true);
    const password = meta.passwordProtected ? this.form.getRawValue().password : undefined;
    this.downloads.download(this.token, password).subscribe({
      next: (blob) => {
        this.saveBlob(blob, meta.name);
        this.downloading.set(false);
      },
      error: (err: ApiError) => {
        if (err.status !== 0) {
          this.serverError.set(err);
        }
        this.downloading.set(false);
      },
    });
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}
