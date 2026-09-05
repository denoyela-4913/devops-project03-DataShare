import { Component, input, output } from '@angular/core';

export type UiSwitchValue = 'all' | 'active' | 'expired';

/** Filtre segmenté Tous / Actifs / Expiré. Frame Figma : Switch Component 35:301. */
@Component({
  selector: 'app-ui-switch',
  templateUrl: './ui-switch.html',
  styleUrl: './ui-switch.scss',
})
export class UiSwitch {
  readonly selected = input<UiSwitchValue>('all');
  readonly selectedChange = output<UiSwitchValue>();

  readonly options: { value: UiSwitchValue; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'active', label: 'Actifs' },
    { value: 'expired', label: 'Expiré' },
  ];

  select(value: UiSwitchValue): void {
    this.selectedChange.emit(value);
  }
}
