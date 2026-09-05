import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { FieldError } from '../../../shared/components/field-error/field-error';
import { UiButton } from '../../../shared/components/ui-button/ui-button';
import { UiInput } from '../../../shared/components/ui-input/ui-input';

/** Validateur croisé posé sur `passwordConfirm` : compare à la valeur de `password`. */
function matchPassword(control: AbstractControl): ValidationErrors | null {
  const password = control.parent?.get('password')?.value;
  if (!password || !control.value) {
    return null;
  }
  return password === control.value ? null : { passwordMismatch: true };
}

/**
 * Écran de création de compte (US03). Frame Figma : Desktop - 7 (55:419) · iPhone 16 - 10 (56:491).
 * Le 409 (email déjà pris) est affiché par `ErrorToast` via l'intercepteur d'erreur.
 */
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, FieldError, UiButton, UiInput],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    passwordConfirm: ['', [Validators.required, matchPassword]],
  });

  constructor() {
    // Revalide la confirmation quand le mot de passe change.
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.passwordConfirm.updateValueAndValidity());
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.register(email, password).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => this.submitting.set(false),
    });
  }
}
