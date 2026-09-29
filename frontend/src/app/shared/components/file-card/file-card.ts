import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
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
  host: {
    '(document:keydown.escape)': 'onEscape()',
    '(document:click)': 'onDocumentClick($event)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class FileCard {
  readonly file = input.required<FileSummary>();
  readonly remove = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly moreButton = viewChild<ElementRef<HTMLButtonElement>>('moreButton');

  /** Menu « ⋮ » (affiché sous 833 px uniquement, cf. file-card.scss). */
  readonly menuOpen = signal(false);
  readonly actionsId = computed(() => `file-card-actions-${this.file().id}`);

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  onRemove(): void {
    // Rend le focus au « ⋮ » avant de masquer le panneau : le dialogue de confirmation
    // le mémorise et le restitue à sa fermeture (sans effet en desktop, « ⋮ » masqué).
    this.moreButton()?.nativeElement.focus();
    this.closeMenu();
    this.remove.emit();
  }

  onEscape(): void {
    if (!this.menuOpen()) {
      return;
    }
    this.closeMenu();
    this.moreButton()?.nativeElement.focus();
  }

  onDocumentClick(event: Event): void {
    if (this.menuOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (this.menuOpen() && next && !this.host.nativeElement.contains(next)) {
      this.closeMenu();
    }
  }
}
