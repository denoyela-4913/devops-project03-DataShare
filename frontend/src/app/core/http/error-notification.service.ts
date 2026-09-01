import { Injectable, signal } from '@angular/core';
import type { ApiError } from './api-error';

/**
 * Dernière erreur API à présenter à l'utilisateur. Alimentée par `errorInterceptor`,
 * consommée par `ErrorToast`.
 */
@Injectable({ providedIn: 'root' })
export class ErrorNotificationService {
  private readonly current = signal<ApiError | null>(null);

  readonly error = this.current.asReadonly();

  notify(error: ApiError): void {
    this.current.set(error);
  }

  clear(): void {
    this.current.set(null);
  }
}
