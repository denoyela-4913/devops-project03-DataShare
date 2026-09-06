import { Component, computed, DestroyRef, effect, inject } from '@angular/core';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { ErrorNotificationService } from '../../../core/http/error-notification.service';

/**
 * Bandeau d'erreur global — filet de sécurité : panne réseau et erreurs non prises en
 * charge par un écran (celles-ci s'affichent dans la carte via `<app-form-error>`).
 * Flottant en bas, se referme seul après quelques secondes ; en mode debug
 * (`APP_CONFIG.debugErrors`), ajoute le détail technique du back en info-bulle.
 */
@Component({
  selector: 'app-error-toast',
  templateUrl: './error-toast.html',
  styleUrl: './error-toast.scss',
})
export class ErrorToast {
  private static readonly AUTO_DISMISS_MS = 6000;

  private readonly config = inject(APP_CONFIG);
  private readonly notifier = inject(ErrorNotificationService);
  private timer?: ReturnType<typeof setTimeout>;

  readonly error = this.notifier.error;

  constructor() {
    effect(() => {
      clearTimeout(this.timer);
      if (this.error()) {
        this.timer = setTimeout(() => this.notifier.clear(), ErrorToast.AUTO_DISMISS_MS);
      }
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

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
