import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { APP_CONFIG } from '../config/app-config.token';
import { TokenStore } from './token-store';

/**
 * Ajoute `Authorization: Bearer <token>` aux requêtes vers l'API quand un token est présent.
 *
 * Exception : les endpoints publics qui *émettent* ou *consomment* leur propre jeton
 * (`/api/auth/*`, liens de partage `/api/d/*`). Y joindre un token expiré ferait rejeter la
 * requête en 401 par le resource-server avant d'atteindre le contrôleur — or le login et
 * l'inscription sont précisément censés délivrer un jeton neuf.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStore).token();
  const apiUrl = inject(APP_CONFIG).apiUrl;

  if (token && req.url.startsWith(apiUrl) && !isPublicEndpoint(req.url, apiUrl)) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};

function isPublicEndpoint(url: string, apiUrl: string): boolean {
  return url.startsWith(`${apiUrl}/auth/`) || url.startsWith(`${apiUrl}/d/`);
}
