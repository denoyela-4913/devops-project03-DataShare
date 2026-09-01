import { Component, computed, inject } from '@angular/core';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { ErrorNotificationService } from '../../../core/http/error-notification.service';

/**
 * Bandeau d'erreur global. Affiche toujours le message générique ; en mode debug
 * (`APP_CONFIG.debugErrors`), ajoute le détail technique du back en info-bulle.
 */
@Component({
  selector: 'app-error-toast',
  templateUrl: './error-toast.html',
  styleUrl: './error-toast.scss',
})
export class ErrorToast {
  private readonly config = inject(APP_CONFIG);
  private readonly notifier = inject(ErrorNotificationService);

  readonly error = this.notifier.error;

  /** Texte de l'info-bulle — `null` hors mode debug ou si le back n'a pas renvoyé de détail. */
  readonly debugDetail = computed(() => {
    const current = this.error();
    if (!current || !this.config.debugErrors || !current.debug) {
      return null;
    }
    return `${current.status} ${current.code} — ${current.debug}`;
  });

  dismiss(): void {
    this.notifier.clear();
  }
}
