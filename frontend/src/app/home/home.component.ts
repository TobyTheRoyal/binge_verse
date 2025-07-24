// src/app/home/home.component.ts
import { Component, OnInit, OnDestroy} from '@angular/core';
import { ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { ContentService } from '../core/services/content.service';
import { WatchlistService } from '../core/services/watchlist.service';
import { RatingsService } from '../core/services/ratings.service';
import { AuthService } from '../core/services/auth.service';
import { Content } from '../interfaces/content.interface';
import { debugError } from '../core/utils/logger';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

interface Category {
  id: string;
  title: string;
  items: Content[];
  isLoading: boolean;
}
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  // Reference to the rating input field
  @ViewChild('ratingInput') ratingInputRef?: any;
  /** Gibt true zurück, wenn der Slider nach rechts gescrollt werden kann */
  canScrollRight(categoryId: string): boolean {
    const el = document.getElementById(categoryId);
    if (!el) return false;
    // Allow right scroll only if content is wider than container and not at the end
    return el.scrollWidth - el.clientWidth - el.scrollLeft > 10;
  }
  /** Speichert für jede Kategorie, ob nach links gescrollt werden kann */
  scrollLeftState: { [key: string]: boolean } = {};

  /** Gibt true zurück, wenn der Slider nach links gescrollt werden kann */
  canScrollLeft(categoryId: string): boolean {
    return !!this.scrollLeftState[categoryId];
  }
  categories: Category[] = [
    { id: 'trending',    title: 'Trending Now',  items: [], isLoading: false },
    { id: 'top-rated',   title: 'Top Rated',     items: [], isLoading: false },
    { id: 'new-releases',title: 'New Releases',  items: [], isLoading: false },
    { id: 'watchlist',   title: 'My Watchlist',  items: [], isLoading: false },
  ];

  placeholderItems = Array.from({ length: 5 });

  private setLoading(index: number, value: boolean): void {
    if (this.categories[index]) {
      this.categories[index].isLoading = value;
    }
  }

  isLoggedIn$: Observable<boolean>;
  selectedContentId: string | null = null;
  selectedCategoryId: string | null = null;
  ratingScore = '';
  isRatingSubmitted = false;

  private loginSub?: Subscription;

  constructor(
    private contentService: ContentService,
    private watchlistService: WatchlistService,
    private ratingsService: RatingsService,
    private authService: AuthService,
    private router: Router
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn();
  }

  ngOnInit(): void {
    // zuerst alle User-Ratings laden
    this.ratingsService.fetchUserRatings().subscribe({
      error: err => debugError('Failed to fetch user ratings', err)
    });

    // dann Kategorien laden
    this.loginSub = this.isLoggedIn$.subscribe(loggedIn => {
      if (loggedIn) {
        this.loadCategories();
      } else {
        this.loadPublicCategories();
      }
    });
  }

  private loadCategories(): void {
    this.setLoading(0, true);
    this.contentService.getTrending().subscribe({
      next: data => {
        this.categories[0].items = data;
        this.setLoading(0, false);
        setTimeout(() => this.updateScrollState(this.categories[0].id));
      },
      error: err => { debugError('Failed to load trending', err); this.setLoading(0, false); },
    });
    this.setLoading(1, true);
    this.contentService.getTopRated().subscribe({
      next: data => {
        this.categories[1].items = data;
        this.setLoading(1, false);
        setTimeout(() => this.updateScrollState(this.categories[1].id));
      },
      error: err => { debugError('Failed to load top rated', err); this.setLoading(1, false); },
    });
    this.setLoading(2, true);
    this.contentService.getNewReleases().subscribe({
      next: data => {
        this.categories[2].items = data;
        this.setLoading(2, false);
        setTimeout(() => this.updateScrollState(this.categories[2].id));
      },
      error: err => { debugError('Failed to load new releases', err); this.setLoading(2, false); },
    });
    this.setLoading(3, true);
    this.watchlistService.getWatchlist().subscribe({
      next: data => {
        this.categories[3].items = data;
        this.setLoading(3, false);
        setTimeout(() => this.updateScrollState(this.categories[3].id));
      },
      error: err => { debugError('Failed to load watchlist', err); this.setLoading(3, false); },
    });
  }

  private loadPublicCategories(): void {
    this.setLoading(0, true);
    this.contentService.getTrending().subscribe({
      next: data => {
        this.categories[0].items = data;
        this.setLoading(0, false);
        setTimeout(() => this.updateScrollState(this.categories[0].id));
      },
      error: err => { debugError('Failed to load trending', err); this.setLoading(0, false); },
    });
    this.setLoading(1, true);
    this.contentService.getTopRated().subscribe({
      next: data => {
        this.categories[1].items = data;
        this.setLoading(1, false);
        setTimeout(() => this.updateScrollState(this.categories[1].id));
      },
      error: err => { debugError('Failed to load top rated', err); this.setLoading(1, false); },
    });
    this.setLoading(2, true);
    this.contentService.getNewReleases().subscribe({
      next: data => {
        this.categories[2].items = data;
        this.setLoading(2, false);
        setTimeout(() => this.updateScrollState(this.categories[2].id));
      },
      error: err => { debugError('Failed to load new releases', err); this.setLoading(2, false); },
    });
  }

   // in src/app/home/home.component.ts

/** externes Rating (IMDb/RT) */
getExternalRating(item: Content, source: 'imdb' | 'rt'): number | null {
  if (source === 'imdb') {
    return item.imdbRating ?? null;
  } else {
    return item.rtRating  ?? null;
  }
}


  /** eigenes Rating aus RatingsService (float 1.1-1) */
  getRating(tmdbId: string): number | null {
    return this.ratingsService.getRating(tmdbId);
  }

  isInWatchlist(contentId: string): boolean {
    return this.watchlistService.isInWatchlist(contentId);
  }

  toggleWatchlist(contentId: string, type: 'movie' | 'tv'): void {
    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) {
        this.router.navigate(['/auth/login']);
        return;
      }
      const call = this.isInWatchlist(contentId)
        ? this.watchlistService.removeFromWatchlist(contentId)
        : this.watchlistService.addToWatchlist(contentId, type);

      call.subscribe({
        next: () => this.loadCategories(),
        error: err => debugError(err)
      });
    });
  }

  startRating(categoryId: string, contentId: string): void {
    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) {
        this.router.navigate(['/auth/login']);
        return;
      }
      this.selectedCategoryId = categoryId;
      this.selectedContentId = contentId;
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
    this.selectedCategoryId = null;
    this.selectedContentId = null;
    this.ratingScore = '';
    this.isRatingSubmitted = false;
  }

  submitRating(tmdbId: string): void {
    const score = parseFloat(this.ratingScore);
    if (isNaN(score) || score < 0 || score > 10) {
      debugError('Invalid rating: must be between 0.0 and 10.0');
      return;
    }
    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) {
        this.router.navigate(['/auth/login']);
        return;
      }
      // RATE VIA RatingsService
      this.ratingsService.rateContent(tmdbId, score).subscribe({
        next: () => {
          this.isRatingSubmitted = true;
          // neu laden, damit Badge angezeigt wird
          this.ratingsService.fetchUserRatings().subscribe();
          setTimeout(() => this.stopRating(), 500);
        },
        error: err => debugError('Failed to set rating', err)
      });
    });
  }

  scrollLeft(categoryId: string): void {
    const el = document.getElementById(categoryId);
    if (el) {
      el.scrollBy({ left: -300, behavior: 'smooth' });
      setTimeout(() => this.updateScrollState(categoryId), 350);
    }
  }

  scrollRight(categoryId: string): void {
    const el = document.getElementById(categoryId);
    if (el) {
      el.scrollBy({ left: 300, behavior: 'smooth' });
      setTimeout(() => this.updateScrollState(categoryId), 350);
    }
  }

  /** Prüft nach jedem Scrollen, ob links gescrollt werden kann */
  updateScrollState(categoryId: string): void {
    const el = document.getElementById(categoryId);
    this.scrollLeftState[categoryId] = !!el && el.scrollLeft > 0;
  }

  /** Initialisiere Scroll-Status nach View-Init */
  ngAfterViewInit(): void {
    this.categories.forEach(cat => this.updateScrollState(cat.id));
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

  ngOnDestroy(): void {
    this.loginSub?.unsubscribe();
  }

  navigateTo(item: any) {
  const route = item.type === 'movie' ? '/movies' : '/series';
  this.router.navigate([route, item.tmdbId]);
}
}
