import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FieldError } from '../../shared/components/field-error/field-error';

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
 * ⚠️ La soumission n'est pas encore reliée à l'API (US01 backend).
 */
@Component({
  selector: 'app-upload',
  imports: [ReactiveFormsModule, FieldError],
  templateUrl: './upload.html',
  styleUrl: './upload.scss',
})
export class Upload {
  private readonly fb = inject(FormBuilder);

  readonly state = signal<UploadState>('landing');
  readonly submitting = signal(false);
  readonly shareUrl = signal<string | null>(null);
  readonly copied = signal(false);

  selectedFile = signal<File | null>(null);
  readonly fileTooLarge = computed(() => (this.selectedFile()?.size ?? 0) > MAX_FILE_BYTES);
  readonly fileSizeLabel = computed(() => {
    const file = this.selectedFile();
    if (!file) return '';
    const mb = file.size / 1_048_576;
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} Go` : `${mb.toFixed(1)} Mo`;
  });

  readonly form = this.fb.nonNullable.group({
    password: [''],
    expiration: ['1d', Validators.required],
  });

  readonly expirationOptions = [
    { value: '1d', label: 'Une journée' },
    { value: '3d', label: '3 jours' },
    { value: '7d', label: 'Une semaine' },
    { value: '30d', label: '30 jours' },
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
    if (this.fileTooLarge() || !this.selectedFile()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    // TODO(US01 backend) : appeler FileService.upload() et récupérer l'URL.
    // Simulation :
    setTimeout(() => {
      this.shareUrl.set('https://datashare.fr/UhGyr');
      this.state.set('success');
      this.submitting.set(false);
    }, 0);
  }

  copyLink(): void {
    const url = this.shareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  uploadAnother(): void {
    this.selectedFile.set(null);
    this.shareUrl.set(null);
    this.copied.set(false);
    this.form.reset({ password: '', expiration: '1d' });
    this.state.set('landing');
  }
}
