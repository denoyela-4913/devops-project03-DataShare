import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

/**
 * Écran de connexion (US04 — voir DESIGN.md). Frame Figma : Desktop - 6 (55:400) ·
 * iPhone 16 - 9 (55:343).
 *
 * Validation cliente uniquement pour l'instant : la soumission n'est pas encore
 * reliée à `POST /api/auth/login` — le futur `AuthService` sera injecté ici une fois
 * le backend disponible (voir DESIGN.md, US04).
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // TODO(US04): appeler AuthService.login(...) une fois POST /api/auth/login disponible.
  }
}
