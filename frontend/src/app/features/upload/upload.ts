import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FileService } from '../../core/file/file.service';
import { FieldError } from '../../shared/components/field-error/field-error';
import { UiButton } from '../../shared/components/ui-button/ui-button';
import { UiInput } from '../../shared/components/ui-input/ui-input';
import { UiSelect } from '../../shared/components/ui-select/ui-select';

/** Bytes — limite Figma iPhone 16-4 : la taille affichée en rouge est > 1 Go. */
const MAX_FILE_BYTES = 1_073_741_824; // 1 Go

export type UploadState = 'landing' | 'form' | 'success';

/**
 * Écran de téléversement (US01/US07).
 * Frames Figma :
 *   - Landing  : Desktop - 2 (10:217) · iPhone 16 - 1 (1:2)
 *   - Formulaire : Desktop - 1 (10:122) · iPhone 16 - 2 (2:42)
 *   - Erreur taille : iPhone 16 - 4 (5:289)
 *   - Succès : Desktop - 3 (15:272) · iPhone 16 - 3 (5:229)
 *
 * Le mot de passe du fichier (min. 6, US09) est validé côté serveur — l'erreur 400
 * remonte via `ErrorToast`. Les erreurs 4xx sont affichées par l'intercepteur d'erreur.
 */
@Component({
  selector: 'app-upload',
  imports: [ReactiveFormsModule, FieldError, UiButton, UiInput, UiSelect],
  templateUrl: './upload.html',
  styleUrl: './upload.scss',
})
export class Upload {
  private readonly fb = inject(FormBuilder);
  private readonly fileService = inject(FileService);

  readonly state = signal<UploadState>('landing');
  readonly submitting = signal(false);
  readonly shareUrl = signal<string | null>(null);
  readonly copied = signal(false);

  readonly selectedFile = signal<File | null>(null);
  readonly fileTooLarge = computed(() => (this.selectedFile()?.size ?? 0) > MAX_FILE_BYTES);
  readonly fileSizeLabel = computed(() => {
    const file = this.selectedFile();
    if (!file) return '';
    const mb = file.size / 1_048_576;
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} Go` : `${mb.toFixed(1)} Mo`;
  });

  readonly form = this.fb.nonNullable.group({
    password: [''],
    expiration: ['7', Validators.required],
  });

  /** Cahier des charges : durée d'expiration entre 1 et 7 jours. */
  readonly expirationOptions = [
    { value: '1', label: 'Une journée' },
    { value: '3', label: '3 jours' },
    { value: '7', label: 'Une semaine' },
  ];

  startUpload(): void {
    this.state.set('form');
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  clearFile(): void {
    this.selectedFile.set(null);
    this.state.set('landing');
  }

  submit(): void {
    const file = this.selectedFile();
    if (this.fileTooLarge() || !file) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { password, expiration } = this.form.getRawValue();
    this.fileService
      .upload(file, { password: password || undefined, expirationDays: Number(expiration) })
      .subscribe({
        next: (result) => {
          this.shareUrl.set(result.downloadUrl);
          this.state.set('success');
          this.submitting.set(false);
        },
        error: () => this.submitting.set(false),
      });
  }

  copyLink(): void {
    const url = this.shareUrl();
    if (!url) return;
    void navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  uploadAnother(): void {
    this.selectedFile.set(null);
    this.shareUrl.set(null);
    this.copied.set(false);
    this.form.reset({ password: '', expiration: '7' });
    this.state.set('landing');
  }
}
