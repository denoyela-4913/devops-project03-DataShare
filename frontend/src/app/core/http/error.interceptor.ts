import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
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
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifier = inject(ErrorNotificationService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const apiError = toApiError(err);
      if (apiError.status === 0 || !req.context.get(SKIP_ERROR_NOTIFICATION)) {
        notifier.notify(apiError);
      }
      return throwError(() => apiError);
    }),
  );
};
