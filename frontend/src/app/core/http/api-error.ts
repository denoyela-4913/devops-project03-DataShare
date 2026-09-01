import { HttpErrorResponse } from '@angular/common/http';

/** Erreur normalisée côté client, dérivée d'une réponse HTTP en échec. */
export interface ApiError {
  /** Statut HTTP (`0` = pas de réponse / réseau). */
  readonly status: number;
  /** Code métier stable renvoyé par le back, ou `NETWORK` / `UNKNOWN`. */
  readonly code: string;
  /** Message générique destiné à l'utilisateur. */
  readonly message: string;
  /** Détail technique — présent seulement si le back tourne en mode verbeux. */
  readonly debug?: string;
}

/** Forme du corps d'erreur renvoyé par le backend (voir `common/web/ErrorResponse`). */
interface BackendErrorBody {
  status: number;
  error: string;
  code: string;
  message: string;
  path: string;
  debug?: string;
}

export function toApiError(err: HttpErrorResponse): ApiError {
  if (err.status === 0) {
    return { status: 0, code: 'NETWORK', message: 'Connexion au serveur impossible.' };
  }

  const body = err.error as Partial<BackendErrorBody> | string | null;
  if (body && typeof body === 'object' && typeof body.message === 'string') {
    return {
      status: err.status,
      code: typeof body.code === 'string' ? body.code : 'UNKNOWN',
      message: body.message,
      debug: typeof body.debug === 'string' ? body.debug : undefined,
    };
  }

  return { status: err.status, code: 'UNKNOWN', message: 'Une erreur est survenue.' };
}
