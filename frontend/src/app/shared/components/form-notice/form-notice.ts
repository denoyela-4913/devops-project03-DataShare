import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { APP_CONFIG } from '../../../core/config/app-config.token';

export interface FormNoticeData {
  readonly message: string;
  readonly status?: number;
}

const REASON: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
};

/**
 * Confirmation d'action réussie, en tête d'écran. Jumeau de `form-error` : bleu,
 * poli (`role="status"`), disparaît seul après `autoDismissMs`.
 * En mode debug, préfixe le message par le code HTTP (« 204 No Content · … »).
 */
@Component({
  selector: 'app-form-notice',
  template: `
    @if (visible()) {
      <div class="form-notice" role="status" data-testid="form-notice">
        <img
          class="form-notice__icon"
          src="assets/icons/icon-info.svg"
          width="16"
          height="16"
          alt=""
          aria-hidden="true"
        />
        <p class="form-notice__message" data-testid="form-notice-message">{{ display() }}</p>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .form-notice {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 8px 10px;
      border: 1px solid var(--color-callout-info-stroke);
      border-radius: var(--radius-sm);
      background: var(--color-callout-info-bg);
      color: var(--color-callout-info-text);
      font-family: var(--type-small-font, sans-serif);
      font-size: var(--type-small-size, 0.875rem);
      line-height: var(--type-small-line, 1.4);
    }

    .form-notice__icon {
      flex-shrink: 0;
    }

    .form-notice__message {
      margin: 0;
    }

    @media (prefers-reduced-motion: no-preference) {
      .form-notice {
        animation: form-notice-in 160ms ease-out;
      }
    }

    @keyframes form-notice-in {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }

      to {
        opacity: 1;
        transform: none;
      }
    }
  `,
})
export class FormNotice {
  private readonly config = inject(APP_CONFIG);

  readonly notice = input<FormNoticeData | null>(null);
  readonly autoDismissMs = input(3000);

  private readonly hidden = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  readonly visible = computed(() => this.notice() !== null && !this.hidden());

  readonly display = computed(() => {
    const current = this.notice();
    if (!current) {
      return '';
    }
    if (this.config.debugErrors && current.status) {
      const reason = REASON[current.status] ? ` ${REASON[current.status]}` : '';
      return `${current.status}${reason} · ${current.message}`;
    }
    return current.message;
  });

  constructor() {
    effect(() => {
      const current = this.notice();
      clearTimeout(this.timer);
      this.hidden.set(false);
      if (current) {
        this.timer = setTimeout(() => this.hidden.set(true), this.autoDismissMs());
      }
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }
}
