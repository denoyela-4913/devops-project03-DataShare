/** Configuration applicative injectable. Alimentée depuis `src/environments`. */
export interface AppConfig {
  /** `true` pour le build de production. */
  readonly production: boolean;
  /** Préfixe des appels API (proxifié vers le backend). */
  readonly apiUrl: string;
  /**
   * Mode debug : affiche le détail technique des erreurs (champ `debug` renvoyé par le back)
   * en info-bulle sur le message générique. Toujours `false` en production.
   */
  readonly debugErrors: boolean;
}
