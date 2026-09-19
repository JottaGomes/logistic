import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

/**
 * Owns the light/dark choice.
 *
 * Starts from what the person already told their operating system, and only
 * overrides that once they pick something here — a stored choice wins, and keeps
 * winning, because a preference set explicitly should not be second-guessed.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {

  /** A signal so the template re-renders when the theme changes. */
  readonly theme = signal<Theme>('light');

  private readonly root = document.documentElement;

  constructor() {
    this.apply(this.stored() ?? this.systemPreference());
  }

  toggle(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.apply(next);
    this.remember(next);
  }

  private apply(theme: Theme): void {
    this.theme.set(theme);
    this.root.classList.toggle('dark', theme === 'dark');
  }

  /** Storage is unavailable in private browsing, and that must not break the app. */
  private stored(): Theme | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'dark' || value === 'light' ? value : null;
    } catch {
      return null;
    }
  }

  private remember(theme: Theme): void {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // nothing to do: the theme still applies for this visit
    }
  }

  private systemPreference(): Theme {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
