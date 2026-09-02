import { Routes } from '@angular/router';

/**
 * Routes de production. La route `styleguide` (dev uniquement) vit dans
 * `app.routes.development.ts`, substitué par `fileReplacements` en config `development` —
 * ainsi son chunk n'existe pas du tout dans le build prod (job CI `assert-prod-bundle`).
 */
export const routes: Routes = [
  { path: 'login', loadChildren: () => import('./features/auth/login/login.routes') },
  { path: 'register', loadChildren: () => import('./features/auth/register/register.routes') },
];
