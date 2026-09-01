import { Component } from '@angular/core';
import { UiButton } from '../../shared/components/ui-button/ui-button';

/**
 * Catalogue des composants du design-system, confronté à la maquette.
 * Route disponible uniquement hors production (voir app.routes.ts).
 */
@Component({
  selector: 'app-styleguide',
  imports: [UiButton],
  templateUrl: './styleguide.html',
  styleUrl: './styleguide.scss',
})
export class Styleguide {}
