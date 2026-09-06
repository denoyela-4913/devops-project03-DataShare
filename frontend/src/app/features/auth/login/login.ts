import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import type { ApiError } from '../../../core/http/api-error';
import { FieldError } from '../../../shared/components/field-error/field-error';
import { FormError } from '../../../shared/components/form-error/form-error';
import { UiButton } from '../../../shared/components/ui-button/ui-button';
import { UiInput } from '../../../shared/components/ui-input/ui-input';

/**
 * Écran de connexion (US04). Frame Figma : Desktop - 6 (55:400) · iPhone 16 - 9 (55:343).
 * Une erreur serveur (401) s'affiche dans la carte via `<app-form-error>` ; la panne
 * réseau passe par le filet global.
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, FieldError, FormError, UiButton, UiInput],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly serverError = signal<ApiError | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.serverError.set(null);
    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => void this.router.navigateByUrl(this.redirectTarget()),
      error: (err: ApiError) => {
        if (err.status !== 0) {
          this.serverError.set(err);
        }
        this.submitting.set(false);
      },
    });
  }

  private redirectTarget(): string {
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    return redirect?.startsWith('/') ? redirect : '/';
  }
}
