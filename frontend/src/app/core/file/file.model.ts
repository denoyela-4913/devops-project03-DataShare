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
