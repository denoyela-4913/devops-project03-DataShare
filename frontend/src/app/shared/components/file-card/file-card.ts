import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
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
  private readonly injector = inject(Injector);
  private readonly actions = viewChild<ElementRef<HTMLElement>>('actions');
  private readonly moreButton = viewChild<ElementRef<HTMLButtonElement>>('moreButton');

  /** Menu « ⋮ » (affiché sous 833 px uniquement, cf. file-card.scss). */
  readonly menuOpen = signal(false);
  /** Le panneau s'ouvre vers le haut quand il ne tient pas sous la carte. */
  readonly openUp = signal(false);
  readonly actionsId = computed(() => `file-card-actions-${this.file().id}`);

  toggleMenu(): void {
    if (this.menuOpen()) {
      this.closeMenu();
      return;
    }
    this.menuOpen.set(true);
    // Le panneau n'est mesurable qu'une fois affiché.
    afterNextRender(() => this.placeMenu(), { injector: this.injector });
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    this.openUp.set(false);
  }

  private placeMenu(): void {
    const panel = this.actions()?.nativeElement;
    if (!panel) {
      return;
    }
    const card = this.host.nativeElement.getBoundingClientRect();
    const needed = panel.getBoundingClientRect().height;
    const below = document.documentElement.clientHeight - card.bottom;
    this.openUp.set(below < needed && card.top > below);
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
