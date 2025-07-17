import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface FilterOptions {
  genres: string[];
  releaseYearMin: number;
  releaseYearMax: number;
  imdbRatingMin: number;
  rtRatingMin: number;
  providers: string[];
  userRatingMin?: number;
}

@Injectable({ providedIn: 'root' })
export class FilterService {
  private filters = new BehaviorSubject<FilterOptions>({
    genres: [],
    releaseYearMin: 1900,
    releaseYearMax: new Date().getFullYear(),
    imdbRatingMin: 0,
    rtRatingMin: 0,
    providers: [],
    userRatingMin: 0,
  });
  currentFilters = this.filters.asObservable();

  updateFilters(newFilters: Partial<FilterOptions>) {
    this.filters.next({ ...this.filters.value, ...newFilters });
  }

  resetFilters() {
    this.filters.next({
      genres: [],
      releaseYearMin: 1900,
      releaseYearMax: new Date().getFullYear(),
      imdbRatingMin: 0,
      rtRatingMin: 0,
      providers: [],
      userRatingMin: 0,
    });
  }

  getFilters(): FilterOptions {
    return this.filters.value;
  }
}