import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { FieldError } from './field-error';

describe('FieldError', () => {
  function render(control: FormControl) {
    TestBed.configureTestingModule({ imports: [FieldError] });
    const fixture = TestBed.createComponent(FieldError);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();
    return fixture;
  }

  function messageOf(fixture: ReturnType<typeof render>): string | null {
    return (
      (fixture.nativeElement as HTMLElement).querySelector('.field-error')?.textContent?.trim() ??
      null
    );
  }

  it("n'affiche rien tant que le contrôle n'est pas touché", () => {
    const fixture = render(new FormControl('', Validators.required));
    expect(messageOf(fixture)).toBeNull();
  });

  it('affiche le message "requis" une fois touché', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    expect(messageOf(render(control))).toBe('Ce champ est requis');
  });

  it('affiche la longueur minimale pour minlength', () => {
    const control = new FormControl('abc', Validators.minLength(8));
    control.markAsTouched();
    expect(messageOf(render(control))).toBe('Au moins 8 caractères');
  });

  it('utilise un message personnalisé fourni en entrée', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    TestBed.configureTestingModule({ imports: [FieldError] });
    const fixture = TestBed.createComponent(FieldError);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('messages', { required: 'Email obligatoire' });
    fixture.detectChanges();
    expect(messageOf(fixture)).toBe('Email obligatoire');
  });
});
