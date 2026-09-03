import { Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadComponent: () => import('./upload').then((m) => m.Upload) },
];

export default routes;
