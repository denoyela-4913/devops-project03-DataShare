import { Component } from '@angular/core';

/**
 * En-tête applicatif (logo + action Se connecter / Mon espace).
 * Frame Figma : Header 24:440 (Desktop/Mobile × Anonymous/Logged).
 * Le consommateur projette les liens avec `uiHeaderLogo` et `uiHeaderAction`.
 */
@Component({
  selector: 'app-ui-header',
  templateUrl: './ui-header.html',
  styleUrl: './ui-header.scss',
})
export class UiHeader {}
