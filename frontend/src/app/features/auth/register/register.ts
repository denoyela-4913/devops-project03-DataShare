import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('passwordConfirm')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

/**
 * Écran de création de compte (US03 — voir DESIGN.md). Frame Figma :
 * Desktop - 7 (55:419) · iPhone 16 - 10 (56:491).
 *
 * Validation cliente uniquement pour l'instant : la soumission n'est pas encore
 * reliée à `POST /api/auth/register` — le futur `AuthService` sera injecté ici une
 * fois le backend disponible (voir DESIGN.md, US03).
 */
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // TODO(US03): appeler AuthService.register(...) une fois POST /api/auth/register disponible.
  }
}
