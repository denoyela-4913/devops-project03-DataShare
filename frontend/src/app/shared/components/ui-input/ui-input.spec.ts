import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiInput } from './ui-input';

@Component({
  selector: 'app-ui-input-host',
  imports: [UiInput],
  template: '<app-ui-input><input class="ui-field__control" /></app-ui-input>',
})
class UiInputHost {}

describe('UiInput', () => {
  function createInput() {
    TestBed.configureTestingModule({ imports: [UiInput] });
    const fixture = TestBed.createComponent(UiInput);
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  it("n'affiche pas de libellé sans input `label`", () => {
    const { host } = createInput();
    expect(host.querySelector('.ui-field__label')).toBeNull();
  });

  it('affiche le libellé relié au champ via `for`', () => {
    const { fixture, host } = createInput();
    fixture.componentRef.setInput('label', 'Email');
    fixture.componentRef.setInput('inputId', 'login-email');
    fixture.detectChanges();
    const label = host.querySelector('.ui-field__label')!;
    expect(label.textContent).toContain('Email');
    expect(label.getAttribute('for')).toBe('login-email');
  });

  it('reflète `invalid` sur la classe hôte', () => {
    const { fixture, host } = createInput();
    fixture.componentRef.setInput('invalid', true);
    fixture.detectChanges();
    expect(host.classList.contains('ui-field--invalid')).toBe(true);
  });

  it('projette le contenu (champ + erreur)', () => {
    TestBed.configureTestingModule({ imports: [UiInputHost] });
    const fixture = TestBed.createComponent(UiInputHost);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('input.ui-field__control'),
    ).not.toBeNull();
  });
});
