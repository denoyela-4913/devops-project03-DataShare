import { Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { startWith, switchMap } from 'rxjs';

const DEFAULT_MESSAGES: Record<string, string> = {
  required: 'Ce champ est requis',
  email: 'Adresse email invalide',
  passwordMismatch: 'Les mots de passe ne correspondent pas',
};

/**
 * Affiche le premier message d'erreur d'un contrôle de formulaire, une fois celui-ci
 * touché. Composant utilitaire (pas de style issu de Figma).
 */
@Component({
  selector: 'app-field-error',
  template: `
    @if (visible()) {
      <p [id]="id()" class="field-error" role="alert">{{ text() }}</p>
    }
  `,
  styles: `
    .field-error {
      margin: 0;
      color: var(--color-error);
      font-family: var(--type-normal-font, sans-serif);
      font-size: 0.875rem;
    }
  `,
})
export class FieldError {
  readonly control = input.required<AbstractControl>();
  readonly id = input<string>();
  readonly messages = input<Record<string, string>>({});

  /** Se déclenche à chaque événement du contrôle (touched, value, status…). */
  private readonly tick = toSignal(
    toObservable(this.control).pipe(switchMap((control) => control.events.pipe(startWith(null)))),
  );

  readonly visible = computed(() => {
    this.tick();
    const control = this.control();
    return control.invalid && (control.touched || control.dirty);
  });

  readonly text = computed(() => {
    this.tick();
    const errors = this.control().errors;
    if (!errors) {
      return '';
    }
    const key = Object.keys(errors)[0];
    if (key === 'minlength') {
      return `Au moins ${errors['minlength'].requiredLength} caractères`;
    }
    return this.messages()[key] ?? DEFAULT_MESSAGES[key] ?? 'Valeur invalide';
  });
}
