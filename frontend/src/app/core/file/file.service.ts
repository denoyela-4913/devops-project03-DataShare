import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config.token';
import type { FileSummary, UploadOptions, UploadResponse } from './file.model';

/** Fichiers de l'utilisateur : dépôt (US01), historique (US05), suppression (US06). */
@Injectable({ providedIn: 'root' })
export class FileService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  upload(file: File, options: UploadOptions): Observable<UploadResponse> {
    const form = new FormData();
    form.append('file', file);
    form.append('expirationDays', String(options.expirationDays));
    if (options.password) {
      form.append('password', options.password);
    }
    return this.http.post<UploadResponse>(`${this.config.apiUrl}/files`, form);
  }

  /** US05 — historique des fichiers de l'utilisateur, du plus récent au plus ancien. */
  list(): Observable<FileSummary[]> {
    return this.http.get<FileSummary[]>(`${this.config.apiUrl}/files`);
  }

  /** US06 — supprime un fichier de l'utilisateur. */
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/files/${encodeURIComponent(id)}`);
  }
}
