import { Routes } from '@angular/router';
import { commonRoutes } from './app.routes.common';

/**
 * Routes de production. La route `styleguide` (dev uniquement) vit dans
 * `app.routes.development.ts`, substitué par `fileReplacements` en config `development` —
 * ainsi son chunk n'existe pas du tout dans le build prod (job CI `assert-prod-bundle`).
 */
export const routes: Routes = [...commonRoutes];
