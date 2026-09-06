import { Component, computed, inject, input } from '@angular/core';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import type { ApiError } from '../../../core/http/api-error';

/**
 * Bandeau d'erreur serveur, en tête d'un formulaire. Jumeau visuel de `field-error` :
 * composant utilitaire, markup et styles maintenus côté logique (pas de frame Figma),
 * habillage repris des tokens `--color-callout-error-*`.
 * En mode debug (`APP_CONFIG.debugErrors`), déplie le détail technique du back.
 */
@Component({
  selector: 'app-form-error',
  template: `
    @if (error(); as e) {
      <div class="form-error" role="alert" data-testid="form-error">
        <img
          class="form-error__icon"
          src="assets/icons/icon-alert-octagon.svg"
          width="16"
          height="16"
          alt=""
          aria-hidden="true"
        />
        <div class="form-error__body">
          <p class="form-error__message" data-testid="form-error-message">{{ e.message }}</p>
          @if (debugLine(); as line) {
            <details class="form-error__debug" data-testid="form-error-debug">
              <summary>Détail technique</summary>
              <p class="form-error__debug-line">{{ line }}</p>
            </details>
          }
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .form-error {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      padding: 8px 10px;
      border: 1px solid var(--color-callout-error-stroke);
      border-radius: var(--radius-sm);
      background: var(--color-callout-error-bg);
      color: var(--color-callout-error-text);
    }

    .form-error__icon {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .form-error__body {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .form-error__message {
      margin: 0;
      font-family: var(--type-small-font, sans-serif);
      font-size: var(--type-small-size, 0.875rem);
      line-height: var(--type-small-line, 1.4);
    }

    .form-error__debug {
      font-size: 0.8125rem;
    }

    .form-error__debug summary {
      cursor: pointer;
    }

    .form-error__debug-line {
      margin: 4px 0 0;
      font-family: ui-monospace, monospace;
      word-break: break-word;
    }
  `,
})
export class FormError {
  private readonly config = inject(APP_CONFIG);

  readonly error = input<ApiError | null>(null);

  readonly debugLine = computed(() => {
    const e = this.error();
    if (!e || !this.config.debugErrors || !e.debug) {
      return null;
    }
    return `${e.status} ${e.code} — ${e.debug}`;
  });
}
