import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Quand `true`, `errorInterceptor` ne pousse pas l'erreur dans `ErrorNotificationService`
 * (pas de toast global). L'appelant gère l'affichage lui-même — ex. l'écran de
 * téléchargement, où un lien 404/410 est un état de page, pas une erreur transitoire.
 */
export const SKIP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

/** Raccourci : `{ context: skipErrorNotification() }` sur une requête HttpClient. */
export function skipErrorNotification(): HttpContext {
  return new HttpContext().set(SKIP_ERROR_NOTIFICATION, true);
}
