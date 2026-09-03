import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { APP_CONFIG } from '../config/app-config.token';
import { TokenStore } from './token-store';

/** Ajoute `Authorization: Bearer <token>` aux requêtes vers l'API quand un token est présent. */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStore).token();
  const apiUrl = inject(APP_CONFIG).apiUrl;

  if (token && req.url.startsWith(apiUrl)) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
