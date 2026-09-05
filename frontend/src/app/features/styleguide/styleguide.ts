import { Component } from '@angular/core';
import { UiButton } from '../../shared/components/ui-button/ui-button';
import { UiCallout } from '../../shared/components/ui-callout/ui-callout';
import { UiHeader } from '../../shared/components/ui-header/ui-header';
import { UiInput } from '../../shared/components/ui-input/ui-input';
import { UiSelect } from '../../shared/components/ui-select/ui-select';
import { UiSwitch } from '../../shared/components/ui-switch/ui-switch';

/**
 * Catalogue des composants du design-system, confronté à la maquette.
 * Route disponible uniquement hors production (voir app.routes.ts).
 */
@Component({
  selector: 'app-styleguide',
  imports: [UiButton, UiCallout, UiHeader, UiInput, UiSelect, UiSwitch],
  templateUrl: './styleguide.html',
  styleUrl: './styleguide.scss',
})
export class Styleguide {}
