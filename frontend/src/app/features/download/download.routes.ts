import { Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadComponent: () => import('./download').then((m) => m.Download) },
];

export default routes;
