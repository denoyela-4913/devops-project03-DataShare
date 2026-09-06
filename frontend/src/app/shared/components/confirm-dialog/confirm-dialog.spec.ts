import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

@Component({
  selector: 'app-confirm-dialog-host',
  imports: [ConfirmDialog],
  template: `<app-confirm-dialog
    [open]="open()"
    heading="Supprimer ?"
    message="Action définitive."
    confirmLabel="Supprimer"
    (confirm)="confirmed = true"
    (dismissed)="cancelled = true"
  />`,
})
class ConfirmDialogHost {
  readonly open = signal(false);
  confirmed = false;
  cancelled = false;
}

describe('ConfirmDialog', () => {
  // happy-dom n'implémente pas showModal/close sur <dialog> : on les pose nous-mêmes.
  const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  const originals = { showModal: proto['showModal'], close: proto['close'] };
  let showModal: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    });
    proto['showModal'] = showModal;
    proto['close'] = close;
  });

  afterEach(() => {
    proto['showModal'] = originals.showModal;
    proto['close'] = originals.close;
  });

  function render() {
    TestBed.configureTestingModule({ imports: [ConfirmDialogHost] });
    const fixture = TestBed.createComponent(ConfirmDialogHost);
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  const testId = (host: HTMLElement, id: string) => host.querySelector(`[data-testid="${id}"]`);

  it('affiche le titre et le message', () => {
    const { host } = render();
    expect(host.querySelector('#confirm-dialog-title')?.textContent).toContain('Supprimer ?');
    expect(testId(host, 'confirm-dialog-message')?.textContent).toContain('Action définitive.');
  });

  it('ouvre le <dialog> quand open passe à true, le ferme au retour à false', () => {
    const { fixture } = render();
    expect(showModal).not.toHaveBeenCalled();

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    expect(showModal).toHaveBeenCalled();

    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    expect(close).toHaveBeenCalled();
  });

  it('émet (confirm) et (cancel) au clic sur les boutons', () => {
    const { fixture, host } = render();
    (testId(host, 'confirm-dialog-confirm') as HTMLElement).querySelector('button')!.click();
    expect(fixture.componentInstance.confirmed).toBe(true);

    (testId(host, 'confirm-dialog-cancel') as HTMLElement).querySelector('button')!.click();
    expect(fixture.componentInstance.cancelled).toBe(true);
  });
});
