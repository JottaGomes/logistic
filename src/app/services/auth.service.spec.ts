import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

/** Builds a JWT whose payload expires the given number of seconds from now. */
function tokenExpiringIn(seconds: number): string {
  const payload = btoa(JSON.stringify({ sub: 'joao', exp: Math.floor(Date.now() / 1000) + seconds }));
  return `header.${payload}.signature`;
}

describe('AuthService', () => {

  let service: AuthService;
  let http: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/api/auth`;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('stores the token and username after logging in', () => {
    service.login('joao', 'secret').subscribe();

    http.expectOne(`${baseUrl}/login`).flush({
      success: true, data: { token: 'a-token', username: 'joao' },
    });

    expect(service.getToken()).toBe('a-token');
    expect(service.getUsername()).toBe('joao');
  });

  it('stores the token after registering, so there is no second login', () => {
    service.register('novo', 'password123').subscribe();

    http.expectOne(`${baseUrl}/register`).flush({
      success: true, data: { token: 'new-token', username: 'novo' },
    });

    expect(service.getToken()).toBe('new-token');
  });

  it('treats an unexpired token as logged in', () => {
    localStorage.setItem('auth_token', tokenExpiringIn(3600));
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('treats an expired token as logged out', () => {
    localStorage.setItem('auth_token', tokenExpiringIn(-10));
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('treats an unreadable token as logged out rather than throwing', () => {
    localStorage.setItem('auth_token', 'not-a-jwt');
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('is logged out when there is no token at all', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('clearSession drops the stored credentials', () => {
    localStorage.setItem('auth_token', 'a-token');
    localStorage.setItem('auth_username', 'joao');

    service.clearSession();

    expect(service.getToken()).toBeNull();
    expect(service.getUsername()).toBeNull();
  });

  it('reads loginEnabled from the backend', async () => {
    const loaded = service.loadConfig();
    http.expectOne(`${baseUrl}/config`).flush({ success: true, data: { loginEnabled: false } });
    await loaded;

    expect(service.loginEnabled).toBeFalse();
  });

  it('requires login when the backend cannot be reached', async () => {
    const loaded = service.loadConfig();
    http.expectOne(`${baseUrl}/config`).error(new ProgressEvent('network error'));
    await loaded;

    expect(service.loginEnabled).toBeTrue();
  });
});
