import type { AppConfig } from '../app/core/config/app-config';

/** Environnement dev : mode debug — le détail technique des erreurs est affiché en info-bulle. */
export const environment: AppConfig = {
  production: false,
  apiUrl: '/api',
  debugErrors: true,
};
