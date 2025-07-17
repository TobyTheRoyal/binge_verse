import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RatingsService } from './ratings.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';

class AuthServiceMock { getToken = () => 'token'; }

describe('RatingsService', () => {
  let service: RatingsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RatingsService, { provide: AuthService, useClass: AuthServiceMock }]
    });
    service = TestBed.inject(RatingsService);
    http = TestBed.inject(HttpTestingController);
  });

  it('should fetch user ratings', () => {
    service.fetchUserRatings().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/ratings`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token');
    req.flush([]);
  });

  it('should post rating', () => {
    service.rateContent('1', 5).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/ratings`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should cache rating after posting', () => {
    service.rateContent('2', 7).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/ratings`);
    req.flush({});
    expect(service.getRating('2')).toBe(7);
  });
});