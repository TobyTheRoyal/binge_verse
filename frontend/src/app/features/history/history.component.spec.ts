import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { HistoryComponent } from './history.component';
import { AuthService } from '../../core/services/auth.service';
import { FilterService } from '../../core/services/filter.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

class AuthServiceMock {
  getToken() { return 'token'; }
}
class RouterMock {
  navigate = jest.fn();
}


describe('HistoryComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useClass: AuthServiceMock },
        { provide: Router, useClass: RouterMock },
        FilterService
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should toggle filters', () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    const comp = fixture.componentInstance;
    comp.showFilters = false;
    comp.toggleFilters();
    expect(comp.showFilters).toBe(true);
  });

  it('should update filters', () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    const comp = fixture.componentInstance;
    const fs = TestBed.inject(FilterService);
    jest.spyOn(fs, 'updateFilters');
    comp.updateFilters({ imdbRatingMin: 5 });
    expect(fs.updateFilters).toHaveBeenCalled();
  });

  it('should reset filters', () => {
  const fixture = TestBed.createComponent(HistoryComponent);
  const comp = fixture.componentInstance;
  const fs = TestBed.inject(FilterService);

  jest.spyOn(fs, 'getFilters').mockReturnValue({
    genres: ['Action'],
    releaseYearMin: 2000,
    releaseYearMax: 2020,
    imdbRatingMin: 5,
    rtRatingMin: 50,
    providers: ['Netflix'],
    userRatingMin: 6,
  });

  jest.spyOn(fs, 'resetFilters');
  comp.resetFilters();
  expect(fs.resetFilters).toHaveBeenCalled();
});

  it('should submit rating', () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    const comp = fixture.componentInstance;
    const http = TestBed.inject(HttpClient);
    jest.spyOn(http, 'post').mockReturnValue(of({}) as any);
    comp.ratingScore = '6';
    comp.submitRating('1');
    expect(http.post).toHaveBeenCalled();
  });
});