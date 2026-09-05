import { Component, input } from '@angular/core';

/**
 * Champ texte du design-system (label + projection de l'input).
 * Frame Figma : Input Component 9:121.
 * L'écran consommateur pose `formControlName` / `aria-*` sur l'input projeté
 * (classe `ui-field__control`).
 */
@Component({
  selector: 'app-ui-input',
  templateUrl: './ui-input.html',
  styleUrl: './ui-input.scss',
  host: {
    '[class.ui-field--invalid]': 'invalid()',
  },
})
export class UiInput {
  readonly label = input<string>('');
  readonly inputId = input<string>('');
  readonly invalid = input(false);
}
