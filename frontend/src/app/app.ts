import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ErrorNotificationService } from './core/http/error-notification.service';
import { ErrorToast } from './shared/components/error-toast/error-toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ErrorToast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    // Le bandeau global ne doit pas suivre l'utilisateur d'un écran à l'autre.
    const notifier = inject(ErrorNotificationService);
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => notifier.clear());
  }
}
