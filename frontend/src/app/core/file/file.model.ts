/** Réponse de `POST /api/files`. */
export interface UploadResponse {
  readonly downloadUrl: string;
  readonly token: string;
  readonly name: string;
  readonly sizeBytes: number;
  readonly expiresAt: string;
}

export interface UploadOptions {
  readonly password?: string;
  readonly expirationDays: number;
}

/** Une ligne de l'historique — réponse de `GET /api/files` (US05). */
export interface FileSummary {
  readonly id: string;
  readonly name: string;
  readonly sizeBytes: number;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly passwordProtected: boolean;
  readonly downloadUrl: string;
}
