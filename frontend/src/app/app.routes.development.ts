import { Routes } from '@angular/router';
import { commonRoutes } from './app.routes.common';

/** Routes de développement : les routes communes + le catalogue de composants `styleguide`. */
export const routes: Routes = [
  { path: 'styleguide', loadChildren: () => import('./features/styleguide/styleguide.routes') },
  ...commonRoutes,
];
