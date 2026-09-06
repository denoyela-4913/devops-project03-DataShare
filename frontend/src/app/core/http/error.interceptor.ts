import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, mergeMap, throwError } from 'rxjs';
import type { ApiError } from './api-error';
import { toApiError } from './api-error';
import { ErrorNotificationService } from './error-notification.service';
import { SKIP_ERROR_NOTIFICATION } from './http-context';

/**
 * Traduit toute réponse HTTP en échec en {@link ApiError} et relance l'`ApiError`
 * pour l'appelant. La pousse dans {@link ErrorNotificationService} (le bandeau global) :
 * - toujours pour une panne réseau (`status 0`) — état global, aucun écran n'en est
 *   responsable ;
 * - sinon, sauf si la requête porte {@link SKIP_ERROR_NOTIFICATION} (l'écran affiche
 *   l'erreur lui-même, dans sa carte).
 *
 * Un corps d'erreur reçu en `Blob` (réponse `responseType: 'blob'`, ex. téléchargement)
 * est relu en texte puis reparsé avant normalisation.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifier = inject(ErrorNotificationService);

  const publish = (err: HttpErrorResponse): ApiError => {
    const apiError = toApiError(err);
    if (apiError.status === 0 || !req.context.get(SKIP_ERROR_NOTIFICATION)) {
      notifier.notify(apiError);
    }
    return apiError;
  };

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.error instanceof Blob) {
        return from(err.error.text()).pipe(
          mergeMap((text) => {
            let parsed: unknown = null;
            try {
              parsed = JSON.parse(text);
            } catch {
              /* corps non-JSON : on garde null, toApiError retombera sur le message générique */
            }
            const rebuilt = new HttpErrorResponse({
              error: parsed,
              headers: err.headers,
              status: err.status,
              statusText: err.statusText,
              url: err.url ?? undefined,
            });
            return throwError(() => publish(rebuilt));
          }),
        );
      }
      return throwError(() => publish(err));
    }),
  );
};
