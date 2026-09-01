import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { toApiError } from './api-error';
import { ErrorNotificationService } from './error-notification.service';

/**
 * Traduit toute réponse HTTP en échec en {@link ApiError}, la pousse dans
 * {@link ErrorNotificationService}, puis relance l'`ApiError` pour l'appelant.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifier = inject(ErrorNotificationService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const apiError = toApiError(err);
      notifier.notify(apiError);
      return throwError(() => apiError);
    }),
  );
};
