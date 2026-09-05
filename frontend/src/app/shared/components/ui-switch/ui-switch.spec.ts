import { TestBed } from '@angular/core/testing';
import { UiSwitch } from './ui-switch';

describe('UiSwitch', () => {
  function createSwitch() {
    TestBed.configureTestingModule({ imports: [UiSwitch] });
    const fixture = TestBed.createComponent(UiSwitch);
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  it('affiche les trois options Tous / Actifs / Expiré', () => {
    const { host } = createSwitch();
    const options = host.querySelectorAll('[role="tab"]');
    expect(options).toHaveLength(3);
    expect(host.querySelector('[data-testid="ui-switch-all"]')?.textContent).toContain('Tous');
    expect(host.querySelector('[data-testid="ui-switch-active"]')?.textContent).toContain('Actifs');
    expect(host.querySelector('[data-testid="ui-switch-expired"]')?.textContent).toContain(
      'Expiré',
    );
  });

  it("marque l'option sélectionnée via aria-selected", () => {
    const { fixture, host } = createSwitch();
    fixture.componentRef.setInput('selected', 'active');
    fixture.detectChanges();
    expect(
      host.querySelector('[data-testid="ui-switch-active"]')?.getAttribute('aria-selected'),
    ).toBe('true');
    expect(host.querySelector('[data-testid="ui-switch-all"]')?.getAttribute('aria-selected')).toBe(
      'false',
    );
  });

  it('émet `selectedChange` au clic sur une option', () => {
    const { fixture, host } = createSwitch();
    let emitted: string | undefined;
    fixture.componentInstance.selectedChange.subscribe((value) => (emitted = value));
    (host.querySelector('[data-testid="ui-switch-expired"]') as HTMLButtonElement).click();
    expect(emitted).toBe('expired');
  });
});
