import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {

  let http: HttpClient;
  let controller: HttpTestingController;
  let token: string | null;

  beforeEach(() => {
    token = 'a-token';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getToken: () => token } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('attaches the token to API requests', () => {
    http.get('/api/shipments').subscribe();

    const request = controller.expectOne('/api/shipments');
    expect(request.request.headers.get('Authorization')).toBe('Bearer a-token');
    request.flush({});
  });

  it('never sends a stale token to the auth endpoints', () => {
    http.post('/api/auth/login', {}).subscribe();

    const request = controller.expectOne('/api/auth/login');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });

  it('sends nothing when there is no token', () => {
    token = null;
    http.get('/api/shipments').subscribe();

    const request = controller.expectOne('/api/shipments');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });
});
