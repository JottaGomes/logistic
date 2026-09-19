import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {

  function build(): ThemeService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [ThemeService] });
    return TestBed.inject(ThemeService);
  }

  function prefersDark(matches: boolean): void {
    spyOn(window, 'matchMedia').and.returnValue({ matches } as MediaQueryList);
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('follows the operating system when nothing has been chosen', () => {
    prefersDark(true);

    expect(build().theme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });

  it('stays light when the system prefers light', () => {
    prefersDark(false);

    expect(build().theme()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
  });

  /** An explicit choice outranks the system setting, and keeps outranking it. */
  it('prefers a stored choice over the system preference', () => {
    prefersDark(true);
    localStorage.setItem('theme', 'light');

    expect(build().theme()).toBe('light');
  });

  it('toggles and remembers', () => {
    prefersDark(false);
    const service = build();

    service.toggle();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
    expect(localStorage.getItem('theme')).toBe('dark');

    service.toggle();

    expect(service.theme()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('ignores a stored value that is not a theme', () => {
    prefersDark(true);
    localStorage.setItem('theme', 'purple');

    expect(build().theme()).toBe('dark');
  });

  /** Storage throws in private browsing; the theme must still apply. */
  it('still switches when storage cannot be written', () => {
    prefersDark(false);
    const service = build();
    spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');

    expect(() => service.toggle()).not.toThrow();
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });
});
