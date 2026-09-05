import { TestBed } from '@angular/core/testing';
import { UiSelect } from './ui-select';

describe('UiSelect', () => {
  function createSelect() {
    TestBed.configureTestingModule({ imports: [UiSelect] });
    const fixture = TestBed.createComponent(UiSelect);
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  it('affiche le libellé relié au champ via `for`', () => {
    const { fixture, host } = createSelect();
    fixture.componentRef.setInput('label', 'Expiration');
    fixture.componentRef.setInput('inputId', 'upload-expiration');
    fixture.detectChanges();
    const label = host.querySelector('.ui-field__label')!;
    expect(label.textContent).toContain('Expiration');
    expect(label.getAttribute('for')).toBe('upload-expiration');
  });

  it('reflète `invalid` sur la classe hôte', () => {
    const { fixture, host } = createSelect();
    fixture.componentRef.setInput('invalid', true);
    fixture.detectChanges();
    expect(host.classList.contains('ui-field--invalid')).toBe(true);
  });

  it('affiche le chevron', () => {
    const { host } = createSelect();
    expect(host.querySelector('.ui-select__chevron')).not.toBeNull();
  });
});
