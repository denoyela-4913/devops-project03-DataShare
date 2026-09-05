import { Component, input } from '@angular/core';

/**
 * Liste déroulante du design-system (label + projection du select + chevron Figma).
 * Frame Figma : Select Component 9:237.
 */
@Component({
  selector: 'app-ui-select',
  templateUrl: './ui-select.html',
  styleUrl: './ui-select.scss',
  host: {
    '[class.ui-field--invalid]': 'invalid()',
  },
})
export class UiSelect {
  readonly label = input<string>('');
  readonly inputId = input<string>('');
  readonly invalid = input(false);
}
