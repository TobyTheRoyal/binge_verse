import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WatchlistService } from './watchlist.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

class AuthServiceMock { getToken = () => 'token'; }

describe('WatchlistService', () => {
  let service: WatchlistService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WatchlistService, { provide: AuthService, useClass: AuthServiceMock }]
    });
    service = TestBed.inject(WatchlistService);
    http = TestBed.inject(HttpTestingController);
  });

  it('should get watchlist', () => {
    service.getWatchlist().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/watchlist/user`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should add to watchlist', () => {
    service.addToWatchlist('1', 'movie').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/watchlist/add`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
  it('should remove from watchlist', () => {
    service.addToWatchlist('2', 'movie').subscribe();
    http.expectOne(`${environment.apiUrl}/watchlist/add`).flush({});
    service.removeFromWatchlist('2').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/watchlist/user/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
    expect(service.isInWatchlist('2')).toBe(false);
  });

  it('should set rating', () => {
    service.addToWatchlist('3', 'movie').subscribe();
    http.expectOne(`${environment.apiUrl}/watchlist/add`).flush({});
    service.setRating('3', 4).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/watchlist/rate`);
    expect(req.request.method).toBe('POST');
    req.flush({});
    expect(service.getRating('3')).toBe(4);
  });

  it('should check watchlist membership', () => {
    service.addToWatchlist('5', 'movie').subscribe();
    http.expectOne(`${environment.apiUrl}/watchlist/add`).flush({});
    expect(service.isInWatchlist('5')).toBe(true);
  });
});