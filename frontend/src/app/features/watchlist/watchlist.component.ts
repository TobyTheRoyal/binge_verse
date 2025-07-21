// src/app/features/watchlist/watchlist.component.ts
import { Component, OnInit, HostListener, OnDestroy, ViewChild} from '@angular/core';
import { CommonModule }                 from '@angular/common';
import { FormsModule }                  from '@angular/forms';
import { RouterModule, Router }         from '@angular/router';
import { Observable, Subscription}                   from 'rxjs';

import { WatchlistService } from '../../core/services/watchlist.service';
import { RatingsService }   from '../../core/services/ratings.service';
import { AuthService }      from '../../core/services/auth.service';
import { Content }          from '../../interfaces/content.interface';
import { debugError } from '../../core/utils/logger';
import { FilterService, FilterOptions } from '../../core/services/filter.service';
import { FilterControlsComponent } from '../filter-controls/filter-controls.component';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FilterControlsComponent],
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss'],
})
export class WatchlistComponent implements OnInit, OnDestroy {
  @ViewChild('ratingInput') ratingInputRef?: any;
  allContents: Content[]           = [];
  filteredContents: Content[]      = [];
  selectedContentId: string | null = null;
  ratingScore                     = '';
  isRatingSubmitted               = false;
  isLoggedIn$: Observable<boolean>;

  currentYear = new Date().getFullYear();
  genres: string[] = [];
  releaseYearMin: number = 1900;
  releaseYearMax: number = this.currentYear;
  imdbRatingMin: number = 0;
  rtRatingMin: number = 0;
  providers: string[] = [];
  showFilters = false;

  private filterServiceSub?: Subscription;

  constructor(
    private watchlistService: WatchlistService,
    private ratingsService:   RatingsService,
    private authService:      AuthService,
    private router:           Router,
    private filterService:    FilterService,
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn();
  }

  ngOnInit(): void {
    // 1) Lade alle bisherigen User-Ratings
    this.ratingsService.fetchUserRatings().subscribe({
      error: err => debugError('Failed to fetch user ratings', err),
      complete: () => {
        // 2) Dann erst Watchlist laden
        this.loadWatchlist();
      }
    });
    this.filterServiceSub = this.filterService.currentFilters.subscribe(f => {
      this.genres = f.genres;
      this.releaseYearMin = f.releaseYearMin;
      this.releaseYearMax = f.releaseYearMax;
      this.imdbRatingMin = f.imdbRatingMin;
      this.rtRatingMin = f.rtRatingMin;
      this.providers = f.providers;
      this.applyFilters();
    });
  }

  private loadWatchlist(): void {
    this.watchlistService.getWatchlist().subscribe({
      next: data => { this.allContents = data; this.applyFilters(); },
      error: err => debugError('Failed to load watchlist', err),
    });
  }

  removeFromWatchlist(tmdbId: string): void {
    this.watchlistService.removeFromWatchlist(tmdbId).subscribe({
      next: () => {
        this.loadWatchlist();
        this.ratingsService.fetchUserRatings().subscribe();
      },
      error: err => debugError('Failed to remove from watchlist', err),
    });
  }

  startRating(tmdbId: string): void {
    this.isLoggedIn$.subscribe(loggedIn => {
      if (!loggedIn) {
        this.router.navigate(['/auth/login']);
        return;
      }
      this.selectedContentId = tmdbId;
      this.ratingScore       = '';
      this.isRatingSubmitted = false;
      setTimeout(() => {
        if (this.ratingInputRef && this.ratingInputRef.nativeElement) {
          this.ratingInputRef.nativeElement.focus();
        }
      });
    });
  }

  goToDetail(tmdbId: string) {
    this.router.navigate(['/movies', tmdbId]);
  }

  onCardClick(tmdbId: string) {
    // Wenn gerade ein Rating-Dialog offen ist, nichts tun:
    if (this.selectedContentId) {
      return;
    }
    this.goToDetail(tmdbId);
  }

  stopRating(): void {
    this.selectedContentId = null;
    this.ratingScore       = '';
    this.isRatingSubmitted = false;
  }

  submitRating(tmdbId: string): void {
    const score = parseFloat(this.ratingScore);
    if (isNaN(score) || score < 0 || score > 10) {
      alert('Score must be between 0.0 and 10.0');
      return;
    }
    this.isLoggedIn$.subscribe(loggedIn => {
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
        error: err => debugError('Failed to set rating', err),
      });
    });
  }

  getRating(tmdbId: string): number | null {
    return this.ratingsService.getRating(tmdbId);
  }

  updateFilters(newFilters: Partial<FilterOptions>): void {
    const current = this.filterService.getFilters();
    const updated = { ...current, ...newFilters } as FilterOptions;
    if (newFilters.imdbRatingMin !== undefined) {
      updated.imdbRatingMin = Number(newFilters.imdbRatingMin);
    }
    if (newFilters.rtRatingMin !== undefined) {
      updated.rtRatingMin = Number(newFilters.rtRatingMin);
    }
    if (newFilters.releaseYearMin && updated.releaseYearMax < updated.releaseYearMin) {
      updated.releaseYearMax = updated.releaseYearMin;
    }
    if (newFilters.releaseYearMax && updated.releaseYearMin > updated.releaseYearMax) {
      updated.releaseYearMin = updated.releaseYearMax;
    }

    if (JSON.stringify(current) === JSON.stringify(updated)) {
      return;
    }

    this.filterService.updateFilters(updated);
  }

  resetFilters(): void {
    const defaults: FilterOptions = {
      genres: [],
      releaseYearMin: 1900,
      releaseYearMax: this.currentYear,
      imdbRatingMin: 0,
      rtRatingMin: 0,
      providers: [],
    };

    if (JSON.stringify(this.filterService.getFilters()) === JSON.stringify(defaults)) {
      return;
    }

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

  private applyFilters(): void {
    const f = this.filterService.getFilters();
    this.filteredContents = this.allContents.filter(c => {
      if (f.genres.length > 0 && !(c.genres?.some(g => f.genres.includes(g)))) return false;
      if (f.providers.length > 0 && !(c.providers?.some(p => f.providers.includes(p)))) return false;
      if (c.releaseYear < f.releaseYearMin || c.releaseYear > f.releaseYearMax) return false;
      if (f.imdbRatingMin > 0) {
        if (c.imdbRating == null || c.imdbRating < f.imdbRatingMin) return false;
      }
      if (f.rtRatingMin > 0) {
        if (c.rtRating == null || c.rtRating < f.rtRatingMin) return false;
      }
      return true;
    });
  }

  ngOnDestroy(): void {
    this.filterServiceSub?.unsubscribe();
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
