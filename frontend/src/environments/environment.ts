import type { AppConfig } from '../app/core/config/app-config';

/**
 * Environnement de base = PRODUCTION (aucun remplacement de fichier en config `production`).
 * Durci par défaut : `debugErrors` désactivé.
 * Vérifié par `environment.spec.ts` et par le job CI `assert-prod-bundle`.
 */
export const environment: AppConfig = {
  production: true,
  apiUrl: '/api',
  debugErrors: false,
};
