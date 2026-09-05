import { Component, input, output } from '@angular/core';

/** Variantes Figma Button Component (20:598). `danger` conservé pour le stub existant. */
export type UiButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'dark' | 'danger';
export type UiButtonSize = 'small' | 'medium';

/** Bouton du design-system. Frame Figma : Button Component 20:598. */
@Component({
  selector: 'app-ui-button',
  templateUrl: './ui-button.html',
  styleUrl: './ui-button.scss',
  host: {
    // Reflète l'état désactivé sur l'hôte : permet aux écrans consommateurs de
    // cibler `[data-testid="..."]` sans devoir descendre jusqu'au <button> interne.
    '[attr.disabled]': "disabled() ? '' : null",
  },
})
export class UiButton {
  readonly variant = input<UiButtonVariant>('primary');
  readonly size = input<UiButtonSize>('medium');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  /** État `aria-pressed` du bouton (toggle). Non posé par défaut. */
  readonly ariaPressed = input<boolean | undefined>(undefined);
  readonly pressed = output<void>();
}
