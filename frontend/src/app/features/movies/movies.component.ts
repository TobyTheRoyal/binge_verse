// movies.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Observable, Subject, Subscription, fromEvent } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  take,
  throttleTime
} from 'rxjs/operators';

import { ContentService } from '../../core/services/content.service';
import { RatingsService } from '../../core/services/ratings.service';
import { AuthService } from '../../core/services/auth.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { FilterService, FilterOptions } from '../../core/services/filter.service';
import { Content } from '../../interfaces/content.interface';
import { debugError, debugLog } from '../../core/utils/logger';
import { FilterControlsComponent } from '../filter-controls/filter-controls.component';

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FilterControlsComponent],
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.scss']
})
export class MoviesComponent implements OnInit, OnDestroy {
  @ViewChild('ratingInput') ratingInputRef?: any;
  movies: Content[] = [];
  selectedContentId: string | null = null;
  ratingScore: string = '';
  isRatingSubmitted: boolean = false;
  isLoggedIn$: Observable<boolean>;

  currentPage = 1;
  isLoading = false;
  hasMore = true;
  currentYear = new Date().getFullYear();
  private filterSubject = new Subject<FilterOptions>();
  private filterSub?: Subscription;
  private filterServiceSub?: Subscription;
  private scrollSub?: Subscription;

  private emptyPageCount = 0;
  private readonly maxEmptyPages = 10;
  private readonly maxPageLimit = 50;


  genres: string[] = [];
  releaseYearMin: number = 1900;
  releaseYearMax: number = this.currentYear;
  imdbRatingMin: number = 0;
  rtRatingMin: number = 0;
  providers: string[] = [];

  showFilters = false;

  constructor(
    private contentService: ContentService,
    private ratingsService: RatingsService,
    private authService: AuthService,
    private watchlistService: WatchlistService,
    public filterService: FilterService,
    private router: Router
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn();
  }

  ngOnInit(): void {
    this.loadPage();
    this.scrollSub = fromEvent(window, 'scroll').pipe(
      throttleTime(200)
    ).subscribe(() => {
      const threshold = 300;
      const pos = window.innerHeight + window.scrollY;
      const height = document.body.offsetHeight;
      if (height - pos < threshold) this.loadPage();
    });
    this.filterSub = this.filterSubject
  .pipe(
    debounceTime(500),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
    switchMap((filters) => {
      this.currentPage = 1;
      this.emptyPageCount = 0;
      this.hasMore = true;
      this.movies = [];
      this.isLoading = true;
      return this.contentService.getFilteredMovies(filters, this.currentPage);
    })
  )
  .subscribe({
    next: (data) => {
      const filtered = data.filter(m => typeof m.imdbRating === 'number');
      this.movies = filtered;
      this.currentPage++;
      this.isLoading = false;

      if (filtered.length === 0) {
        // Starte automatisches Preloading
        this.loadUntilHitOrLimit();
      }
      this.hasMore = true; // lassen wir offen, scroll entscheidet selbst mit emptyPageCount
    },
    error: () => {
      debugError('Failed to load filtered movies');
      this.isLoading = false;
    }
  });


    this.filterServiceSub = this.filterService.currentFilters.subscribe(filters => {
      this.genres = filters.genres;
      this.releaseYearMin = filters.releaseYearMin;
      this.releaseYearMax = filters.releaseYearMax;
      this.imdbRatingMin = filters.imdbRatingMin;
      this.rtRatingMin = filters.rtRatingMin;
      this.providers = filters.providers;
      this.filterSubject.next(filters);
    });
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
    this.filterServiceSub?.unsubscribe();
    this.scrollSub?.unsubscribe();
  }

  updateFilters(newFilters: Partial<FilterOptions>): void {
    const currentFilters = this.filterService.getFilters();
    const updatedFilters = { ...currentFilters, ...newFilters } as FilterOptions;
    if (newFilters.imdbRatingMin !== undefined) {
      updatedFilters.imdbRatingMin = Number(newFilters.imdbRatingMin);
    }
    if (newFilters.rtRatingMin !== undefined) {
      updatedFilters.rtRatingMin = Number(newFilters.rtRatingMin);
    }
    if (newFilters.releaseYearMin && updatedFilters.releaseYearMax < updatedFilters.releaseYearMin) {
      updatedFilters.releaseYearMax = updatedFilters.releaseYearMin;
    }
    if (newFilters.releaseYearMax && updatedFilters.releaseYearMin > updatedFilters.releaseYearMax) {
      updatedFilters.releaseYearMin = updatedFilters.releaseYearMax;
    }

    if (JSON.stringify(currentFilters) === JSON.stringify(updatedFilters)) {
      return;
    }

    this.currentPage = 1;
    this.movies = [];
    this.hasMore = true;
    this.isLoading = true;
    this.filterService.updateFilters(updatedFilters);
  }

  resetFilters(): void {
    const defaultFilters: FilterOptions = {
      genres: [],
      releaseYearMin: 1900,
      releaseYearMax: this.currentYear,
      imdbRatingMin: 0,
      rtRatingMin: 0,
      providers: [],
    };

    if (JSON.stringify(this.filterService.getFilters()) === JSON.stringify(defaultFilters)) {
      return;
    }
    
    this.currentPage = 1;
    this.movies = [];
    this.hasMore = true;
    this.isLoading = true;
    this.filterService.resetFilters();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  hasActiveFilters(): boolean {
    const f = this.filterService.getFilters();
    return (
      f.genres.length > 0 ||
      f.releaseYearMin !== 1900 ||
      f.releaseYearMax !== this.currentYear ||
      f.imdbRatingMin > 0 ||
      f.rtRatingMin > 0 ||
      f.providers.length > 0
    );
  }

  loadUntilHitOrLimit(): void {
  if (this.isLoading || !this.hasMore) return;

  this.isLoading = true;
  const filters = this.filterService.getFilters();

  const tryNextPage = () => {
    this.contentService.getFilteredMovies(filters, this.currentPage).subscribe({
      next: (data) => {
        const filtered = data.filter(m => typeof m.imdbRating === 'number');

        if (filtered.length > 0) {
          this.movies.push(...filtered);
          this.emptyPageCount = 0;
        } else {
          this.emptyPageCount++;
        }

        this.currentPage++;

        // ⛔ Abbrechen, wenn Grenze erreicht
        if (this.emptyPageCount >= this.maxEmptyPages || this.currentPage > this.maxPageLimit) {
          this.hasMore = false;
          this.isLoading = false;
          return;
        }

        // ✅ Wenn noch keine Treffer → nächste Seite laden
        if (this.movies.length === 0) {
          tryNextPage(); // rekursiv
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        debugError('Fehler beim Vorladen Seite', this.currentPage);
        this.isLoading = false;
      }
    });
  };

  tryNextPage();
}

  loadMoviesUntil(minCount: number): void {
  if (this.isLoading || !this.hasMore) return;
  this.isLoading = true;

  const filters = this.filterService.getFilters();
  let batchMovies: Content[] = [];

  const tryNext = () => {
    if (this.currentPage > this.maxPageLimit) {
      this.hasMore = false;
      this.isLoading = false;
      return;
    }

    this.contentService.getFilteredMovies(filters, this.currentPage).subscribe({
      next: (data) => {
        const filtered = data.filter(m => typeof m.imdbRating === 'number');

        if (filtered.length > 0) {
          batchMovies.push(...filtered);
          this.emptyPageCount = 0;
        } else {
          this.emptyPageCount++;
        }

        this.currentPage++;

        if (batchMovies.length >= minCount || this.emptyPageCount >= this.maxEmptyPages) {
          this.movies.push(...batchMovies);
          this.isLoading = false;
          if (this.emptyPageCount >= this.maxEmptyPages || this.currentPage > this.maxPageLimit) {
            this.hasMore = false;
          }
          return;
        }

        tryNext(); // nächste Seite
      },
      error: () => {
        debugError('Fehler beim Laden Seite', this.currentPage);
        this.isLoading = false;
      }
    });
  };

  tryNext();
}



  loadPage(): void {
  if (this.isLoading || !this.hasMore) return;
  this.isLoading = true;

  this.contentService.getFilteredMovies(this.filterService.getFilters(), this.currentPage).subscribe({
    next: (data) => {
      const filtered = data.filter(m => typeof m.imdbRating === 'number');

      if (filtered.length > 0) {
        this.movies.push(...filtered);
        this.emptyPageCount = 0; // Reset
      } else {
        this.emptyPageCount++;
      }

      this.currentPage++;
      this.isLoading = false;

      if (this.emptyPageCount >= this.maxEmptyPages) {
        this.hasMore = false;
      }
    },
    error: () => {
      debugError('Fehler beim Laden von Seite', this.currentPage);
      this.isLoading = false;
    }
  });
}


  startRating(tmdbId: string): void {
    this.isLoggedIn$.subscribe((loggedIn: boolean) => {
      if (!loggedIn) {
        this.router.navigate(['/auth/login']);
        return;
      }
      this.selectedContentId = tmdbId;
      this.ratingScore = '';
      this.isRatingSubmitted = false;
      setTimeout(() => {
        if (this.ratingInputRef && this.ratingInputRef.nativeElement) {
          this.ratingInputRef.nativeElement.focus();
        }
      });
    });
  }

  stopRating(): void {
    this.selectedContentId = null;
    this.ratingScore = '';
    this.isRatingSubmitted = false;
  }

  submitRating(tmdbId: string): void {
    const score = parseFloat(this.ratingScore);
    if (isNaN(score) || score < 0 || score > 10) {
      alert('Bewertung muss zwischen 0.0 und 10.0 liegen');
      return;
    }
    this.isLoggedIn$.pipe(take(1)).subscribe((loggedIn: boolean) => {
      if (!loggedIn) {
        this.router.navigate(['/auth/login']);
        return;
      }
      this.ratingsService.rateContent(tmdbId, score).subscribe({
        next: () => {
          this.isRatingSubmitted = true;
          this.ratingsService.fetchUserRatings().subscribe();
          setTimeout(() => this.stopRating(), 500);
        },
        error: (err) => debugError('Bewertung fehlgeschlagen', err)
      });
    });
  }

  isInWatchlist(contentId: string): boolean {
    return this.watchlistService.isInWatchlist(contentId);
  }

  toggleWatchlist(contentId: string): void {
    this.isLoggedIn$.pipe(take(1)).subscribe((loggedIn: boolean) => {
      if (!loggedIn) {
        this.router.navigate(['/auth/login']);
        return;
      }
      const call = this.isInWatchlist(contentId)
        ? this.watchlistService.removeFromWatchlist(contentId)
        : this.watchlistService.addToWatchlist(contentId, 'movie');

      call.subscribe({
        next: () => {},
        error: (err) => debugError('Watchlist-Aktion fehlgeschlagen', err)
      });
    });
  }

  getRating(tmdbId: string): number | null {
    return this.ratingsService.getRating(tmdbId);
  }

  trackByMovie(index: number, movie: Content): string {
    return movie.tmdbId;
  }

  goToDetail(tmdbId: string) {
    this.router.navigate(['/movies', tmdbId]);
  }

  onCardClick(tmdbId: string) {
    if (this.selectedContentId) {
      return;
    }
    this.goToDetail(tmdbId);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.selectedContentId) return;
    if (event.key === 'Escape') return this.stopRating();
    if (event.repeat || event.key === 'Backspace') return;
    event.preventDefault();

    if (/[0-9]/.test(event.key)) {
      if (this.ratingScore === '' || this.ratingScore.endsWith('.')) {
        this.ratingScore += event.key;
      } else {
        this.ratingScore = event.key;
      }
      if (parseFloat(this.ratingScore) > 10) {
        this.ratingScore = '10';
      }
    } else if (event.key === '.') {
      if (!this.ratingScore.includes('.') && this.ratingScore !== '') {
        this.ratingScore += '.';
      }
    } else if (event.key === 'Enter') {
      this.submitRating(this.selectedContentId!);
    }
  }

}
