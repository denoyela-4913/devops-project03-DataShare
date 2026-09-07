import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { ErrorNotificationService } from './core/http/error-notification.service';
import { ErrorToast } from './shared/components/error-toast/error-toast';
import { UiHeader } from './shared/components/ui-header/ui-header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ErrorToast, UiHeader],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly currentUrl = signal(this.router.url);
  readonly hideChrome = computed(() => this.currentUrl().split('?')[0].startsWith('/history'));

  constructor() {
    const notifier = inject(ErrorNotificationService);
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        notifier.clear();
      }
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);
      }
    });
  }
}
