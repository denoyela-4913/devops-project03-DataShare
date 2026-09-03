/** Réponse de `POST /api/auth/register` et `POST /api/auth/login`. */
export interface TokenResponse {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly expiresIn: number;
}

/** Réponse de `GET /api/me`. */
export interface CurrentUser {
  readonly id: string;
  readonly email: string;
}
