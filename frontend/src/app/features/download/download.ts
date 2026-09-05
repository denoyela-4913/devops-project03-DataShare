import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import type { FileMetadata } from '../../core/download/download.model';
import { DownloadService } from '../../core/download/download.service';
import type { ApiError } from '../../core/http/api-error';
import { FieldError } from '../../shared/components/field-error/field-error';
import { UiButton } from '../../shared/components/ui-button/ui-button';
import { UiCallout } from '../../shared/components/ui-callout/ui-callout';
import { UiInput } from '../../shared/components/ui-input/ui-input';

export type DownloadState = 'loading' | 'ready' | 'not-found' | 'expired';

/**
 * Écran de téléchargement d'un lien de partage (US02). Accès anonyme.
 * Le mot de passe éventuel (403) et les autres erreurs du POST remontent via `ErrorToast` ;
 * un lien 404/410 est un état de page (pas de toast — voir `DownloadService`).
 */
@Component({
  selector: 'app-download',
  imports: [ReactiveFormsModule, FieldError, UiButton, UiCallout, UiInput],
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

  readonly form = this.fb.nonNullable.group({
    password: ['', Validators.required],
  });

  readonly sizeLabel = computed(() => {
    const mb = (this.metadata()?.sizeBytes ?? 0) / 1_048_576;
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} Go` : `${mb.toFixed(1)} Mo`;
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
    this.downloading.set(true);
    const password = meta.passwordProtected ? this.form.getRawValue().password : undefined;
    this.downloads.download(this.token, password).subscribe({
      next: (blob) => {
        this.saveBlob(blob, meta.name);
        this.downloading.set(false);
      },
      error: () => this.downloading.set(false),
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
