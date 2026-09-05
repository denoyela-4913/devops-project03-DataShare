import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config.token';
import { skipErrorNotification } from '../http/http-context';
import type { FileMetadata } from './download.model';

/** Consultation et téléchargement d'un fichier via son lien de partage (US02). */
@Injectable({ providedIn: 'root' })
export class DownloadService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  /** Infos du lien. 404/410 gérés en état de page → pas de toast global. */
  metadata(token: string): Observable<FileMetadata> {
    return this.http.get<FileMetadata>(`${this.config.apiUrl}/d/${encodeURIComponent(token)}`, {
      context: skipErrorNotification(),
    });
  }

  /** Octets du fichier. Un mauvais mot de passe (403) remonte via le toast global. */
  download(token: string, password?: string): Observable<Blob> {
    return this.http.post(
      `${this.config.apiUrl}/d/${encodeURIComponent(token)}`,
      { password: password ?? null },
      { responseType: 'blob' },
    );
  }
}
