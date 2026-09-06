import { Component, input, output } from '@angular/core';
import type { FileSummary } from '../../../core/file/file.model';
import { ExpiryStatusPipe } from '../../pipes/expiry-status-pipe';
import { FileSizePipe } from '../../pipes/file-size-pipe';
import { UiButton } from '../ui-button/ui-button';

/** Ligne de l'historique : nom, taille, état d'expiration + actions copier / supprimer (US05/US06). */
@Component({
  selector: 'app-file-card',
  imports: [FileSizePipe, ExpiryStatusPipe, UiButton],
  templateUrl: './file-card.html',
  styleUrl: './file-card.scss',
})
export class FileCard {
  readonly file = input.required<FileSummary>();
  readonly copyRequested = output<void>();
  readonly remove = output<void>();
}
