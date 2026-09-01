import { TestBed } from '@angular/core/testing';
import { UiButton } from './ui-button';

describe('UiButton', () => {
  function createButton() {
    TestBed.configureTestingModule({ imports: [UiButton] });
    const fixture = TestBed.createComponent(UiButton);
    fixture.detectChanges();
    const el = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    return { fixture, el };
  }

  it('applique la classe de variante', () => {
    const { fixture, el } = createButton();
    fixture.componentRef.setInput('variant', 'danger');
    fixture.detectChanges();
    expect(el.className).toContain('ui-button--danger');
  });

  it('émet (pressed) au clic', () => {
    const { fixture, el } = createButton();
    let count = 0;
    fixture.componentInstance.pressed.subscribe(() => (count += 1));
    el.click();
    expect(count).toBe(1);
  });

  it("reflète l'état désactivé", () => {
    const { fixture, el } = createButton();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(el.disabled).toBe(true);
  });
});
