import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { MovieDetailComponent } from './movie-detail.component';
import { ContentService } from '../../core/services/content.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { RatingsService } from '../../core/services/ratings.service';
import { AuthService } from '../../core/services/auth.service';

class ContentServiceMock {
  getMovieDetails = jest.fn().mockReturnValue(of({ tmdbId: '1' }));
}
class WatchlistServiceMock {
  getWatchlist = jest.fn().mockReturnValue(of([]));
  addToWatchlist = jest.fn().mockReturnValue(of(true));
  removeFromWatchlist = jest.fn().mockReturnValue(of(true));
}
class RatingsServiceMock {
  fetchUserRatings = jest.fn().mockReturnValue(of([]));
  rateContent = jest.fn().mockReturnValue(of(null));
  getRating() { return null; }
}
class AuthServiceMock { isLoggedIn = () => of(true); }
class ActivatedRouteMock { snapshot = { paramMap: new Map([['id','1']]) }; }
class RouterMock { navigate = jest.fn(); }

describe('MovieDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieDetailComponent],
      providers: [
        { provide: ContentService, useClass: ContentServiceMock },
        { provide: WatchlistService, useClass: WatchlistServiceMock },
        { provide: RatingsService, useClass: RatingsServiceMock },
        { provide: AuthService, useClass: AuthServiceMock },
        { provide: ActivatedRoute, useClass: ActivatedRouteMock },
        { provide: Router, useClass: RouterMock }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MovieDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load movie details on init', () => {
    const fixture = TestBed.createComponent(MovieDetailComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    const svc = TestBed.inject(ContentService) as any;
    expect(svc.getMovieDetails).toHaveBeenCalled();
    expect(comp.movie).toBeTruthy();
    expect(comp.isLoading).toBe(false);
  });

  it('should toggle watchlist', () => {
    const fixture = TestBed.createComponent(MovieDetailComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    const wl = TestBed.inject(WatchlistService) as any;
    comp.movie = { tmdbId: '1' } as any;
    comp.isInWL = false;
    comp.toggleWatchlist();
    expect(wl.addToWatchlist).toHaveBeenCalledWith('1', 'movie');
  });

  it('should submit rating', () => {
    const fixture = TestBed.createComponent(MovieDetailComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    comp.movie = { tmdbId: '1' } as any;
    const rs = TestBed.inject(RatingsService) as any;
    comp.ratingScore = '7';
    comp.submitRating();
    expect(rs.rateContent).toHaveBeenCalledWith('1', 7);
  });
});