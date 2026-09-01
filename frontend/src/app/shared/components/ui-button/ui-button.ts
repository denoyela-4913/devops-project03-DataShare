import { Component, input, output } from '@angular/core';

export type UiButtonVariant = 'primary' | 'secondary' | 'danger';

/** Bouton du design-system. Exemple de composant à structure @figma-owned. */
@Component({
  selector: 'app-ui-button',
  templateUrl: './ui-button.html',
  styleUrl: './ui-button.scss',
})
export class UiButton {
  readonly variant = input<UiButtonVariant>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly pressed = output<void>();
}
