/** Réponse de `GET /api/d/{token}` — infos affichables avant téléchargement (US02). */
export interface FileMetadata {
  readonly name: string;
  readonly sizeBytes: number;
  readonly expiresAt: string;
  readonly passwordProtected: boolean;
}
