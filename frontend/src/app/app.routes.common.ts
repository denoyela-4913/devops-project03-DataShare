import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

/** Routes communes aux builds prod et dev (voir app.routes.ts / app.routes.development.ts). */
export const commonRoutes: Routes = [
  { path: 'login', loadChildren: () => import('./features/auth/login/login.routes') },
  { path: 'register', loadChildren: () => import('./features/auth/register/register.routes') },
  { path: 'upload', loadChildren: () => import('./features/upload/upload.routes') },
  {
    path: '',
    loadChildren: () => import('./features/home/home.routes'),
    canActivate: [authGuard],
  },
];
