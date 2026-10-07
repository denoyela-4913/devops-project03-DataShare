import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config.token';
import { skipErrorNotification } from '../http/http-context';
import { toAbsoluteShareUrl } from '../../shared/utils/share-url';
import type { FileSummary, UploadOptions, UploadResponse } from './file.model';

/**
 * Fichiers de l'utilisateur : dépôt (US01), historique (US05), suppression (US06).
 * Les liens de partage relatifs renvoyés par l'API (`/d/<token>`) sont rendus absolus ici, avec
 * l'origine du navigateur, pour que tous les écrans reçoivent un lien utilisable tel quel.
 */
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
    return this.http
      .post<UploadResponse>(`${this.config.apiUrl}/files`, form, {
        context: skipErrorNotification(),
      })
      .pipe(map((r) => ({ ...r, downloadUrl: toAbsoluteShareUrl(r.downloadUrl) })));
  }

  /** US05 — historique des fichiers de l'utilisateur, du plus récent au plus ancien. */
  list(): Observable<FileSummary[]> {
    return this.http
      .get<FileSummary[]>(`${this.config.apiUrl}/files`, {
        context: skipErrorNotification(),
      })
      .pipe(
        map((files) =>
          files.map((f) => ({ ...f, downloadUrl: toAbsoluteShareUrl(f.downloadUrl) })),
        ),
      );
  }

  /** US06 — supprime un fichier de l'utilisateur. Renvoie la réponse pour son code HTTP. */
  remove(id: string): Observable<HttpResponse<void>> {
    return this.http.delete<void>(`${this.config.apiUrl}/files/${encodeURIComponent(id)}`, {
      observe: 'response',
      context: skipErrorNotification(),
    });
  }
}
