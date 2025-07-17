import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('should register via POST', () => {
    service.register({ username: 'u', email: 'e', password: 'p' }).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush({ access_token: 'x' });
  });

  it('should login via POST', () => {
    service.login({ email: 'e', password: 'p' }).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ access_token: 'x' });
  });

  it('should logout and remove token', () => {
    localStorage.setItem('auth_token', 'tok');
    service.logout();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('should return token with getToken and hasToken', () => {
    localStorage.setItem('auth_token', 'tok');
    expect(service.getToken()).toBe('tok');
    expect(service.hasToken()).toBe(true);
    localStorage.removeItem('auth_token');
    expect(service.hasToken()).toBe(false);
  });

  it('should handle login error', (done) => {
    service.login({ email: 'e', password: 'p' }).subscribe({
      next: () => {},
      error: (err) => {
        expect(err.message).toContain('login failed');
        done();
      }
    });
    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush('fail', { status: 500, statusText: 'Server Error' });
  });
});