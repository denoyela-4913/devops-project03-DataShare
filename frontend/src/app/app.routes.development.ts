import { Routes } from '@angular/router';

/** Routes de développement : ajoute le catalogue de composants `styleguide`. */
export const routes: Routes = [
  {
    path: 'styleguide',
    loadChildren: () => import('./features/styleguide/styleguide.routes'),
  },
];
