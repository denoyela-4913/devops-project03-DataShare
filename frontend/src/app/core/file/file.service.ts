import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config.token';
import type { UploadOptions, UploadResponse } from './file.model';

/** Dépôt de fichiers (US01). */
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
}
