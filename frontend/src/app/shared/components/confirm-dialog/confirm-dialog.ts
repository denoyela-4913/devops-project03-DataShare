import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';
import { UiButton } from '../ui-button/ui-button';

/**
 * Boîte de confirmation d'action destructive (US06), bâtie sur le `<dialog>` natif
 * (piège à focus, Échap, `::backdrop`, inertie de la page gérés par le navigateur).
 * L'ouverture est pilotée par l'input `open` ; `confirm` / `cancel` remontent au parent.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [UiButton],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  readonly open = input(false);
  readonly heading = input('Confirmer');
  readonly message = input('');
  readonly confirmLabel = input('Confirmer');
  readonly cancelLabel = input('Annuler');
  readonly confirm = output<void>();
  readonly dismissed = output<void>();

  constructor() {
    effect(() => {
      const el = this.dialog()?.nativeElement;
      if (!el) {
        return;
      }
      if (this.open() && !el.open) {
        el.showModal();
      } else if (!this.open() && el.open) {
        el.close();
      }
    });
  }

  onCancel(event?: Event): void {
    // Empêche la fermeture native immédiate (Échap) : le parent pilote via `open`.
    event?.preventDefault();
    this.dismissed.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }
}
