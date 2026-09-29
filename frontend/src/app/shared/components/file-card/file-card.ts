import { Component, input, output } from '@angular/core';
import type { FileSummary } from '../../../core/file/file.model';
import { ExpiryStatusPipe } from '../../pipes/expiry-status-pipe';
import { ExpiryLabelPipe } from '../../pipes/expiry-label-pipe';
import { UiButton } from '../ui-button/ui-button';

/**
 * Ligne de l'historique : nom, libellé d'expiration, lien « Accéder » (page de
 * téléchargement, nouvel onglet) et action « Supprimer » (US05/US06).
 */
@Component({
  selector: 'app-file-card',
  imports: [ExpiryLabelPipe, ExpiryStatusPipe, UiButton],
  templateUrl: './file-card.html',
  styleUrl: './file-card.scss',
})
export class FileCard {
  readonly file = input.required<FileSummary>();
  readonly remove = output<void>();
}
