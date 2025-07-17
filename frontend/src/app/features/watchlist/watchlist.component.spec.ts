import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { WatchlistComponent } from './watchlist.component';
import { WatchlistService } from '../../core/services/watchlist.service';
import { RatingsService } from '../../core/services/ratings.service';
import { AuthService } from '../../core/services/auth.service';
import { FilterService } from '../../core/services/filter.service';

class WatchlistServiceMock {
  getWatchlist = jest.fn().mockReturnValue(of([]));
  removeFromWatchlist = jest.fn().mockReturnValue(of(null));
}
class RatingsServiceMock {
  fetchUserRatings = jest.fn().mockReturnValue(of([]));
  rateContent = jest.fn().mockReturnValue(of(null));
  getRating() { return null; }
}
class AuthServiceMock { isLoggedIn = () => of(true); }
class RouterMock { navigate = jest.fn(); }

describe('WatchlistComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WatchlistComponent, HttpClientTestingModule],
      providers: [
        { provide: WatchlistService, useClass: WatchlistServiceMock },
        { provide: RatingsService, useClass: RatingsServiceMock },
        { provide: AuthService, useClass: AuthServiceMock },
        { provide: Router, useClass: RouterMock },
        FilterService
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(WatchlistComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should update filters', () => {
    const fixture = TestBed.createComponent(WatchlistComponent);
    const comp = fixture.componentInstance;
    const fs = TestBed.inject(FilterService);
    jest.spyOn(fs, 'updateFilters');
    comp.updateFilters({ imdbRatingMin: 5 });
    expect(fs.updateFilters).toHaveBeenCalled();
  });

  it('should reset filters', () => {
    const fixture = TestBed.createComponent(WatchlistComponent);
    const comp = fixture.componentInstance;
    const fs = TestBed.inject(FilterService);
    jest.spyOn(fs, 'resetFilters');
    comp.resetFilters();
    expect(fs.resetFilters).toHaveBeenCalled();
  });

  it('should submit rating', () => {
    const fixture = TestBed.createComponent(WatchlistComponent);
    const comp = fixture.componentInstance;
    const rs = TestBed.inject(RatingsService) as any;
    comp.ratingScore = '8';
    comp.submitRating('1');
    expect(rs.rateContent).toHaveBeenCalledWith('1', 8);
  });
});