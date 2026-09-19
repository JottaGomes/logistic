import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  /** login and register render standalone, without the app shell */
  isAuthPage = false;

  /** Shown in the top bar, so the page always says what it is. */
  pageTitle = '';

  private static readonly TITLES: Record<string, string> = {
    '/calculate-profit': 'Calculate Profit',
    '/record-data': 'Record Data',
  };

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        const url = (e as NavigationEnd).url;
        this.isAuthPage = url.startsWith('/login') || url.startsWith('/register');

        const path = url.split('?')[0];
        this.pageTitle = AppComponent.TITLES[path] ?? 'Logistics';
      });
  }

  logout(): void {
    this.authService.logout();
  }
}
