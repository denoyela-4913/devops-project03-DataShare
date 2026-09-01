import { InjectionToken, Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
import type { AppConfig } from './app-config';

/**
 * Jeton d'injection de la config applicative.
 *
 * <p>Les composants et services font `inject(APP_CONFIG)` plutôt que d'importer `environment`
 * directement — c'est ce qui rend le mode debug/prod testable (on fournit un `AppConfig` factice
 * dans les tests).
 */
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

/** Fournit la config réelle (issue de l'environnement) — à mettre dans `app.config.ts`. */
export function provideAppConfig(): Provider {
  return { provide: APP_CONFIG, useValue: environment };
}
