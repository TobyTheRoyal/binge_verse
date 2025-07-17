// src/app/home/home.component.ts
import { Component, OnInit, OnDestroy} from '@angular/core';
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

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  categories = [
    { id: 'trending',   title: 'Trending Now',  items: [] as Content[] },
    { id: 'top-rated',  title: 'Top Rated',     items: [] as Content[] },
    { id: 'new-releases', title: 'New Releases', items: [] as Content[] },
    { id: 'watchlist',  title: 'My Watchlist',  items: [] as Content[] },
  ];

  
  
//recommendedItem only used as placeholder for now
  recommendedItems = [
  {
    title: 'The Batman',
    backdrop: 'https://image.tmdb.org/t/p/original/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    tmdbId: '414906',
    type: 'movie'
  },
  {
    title: 'Breaking Bad',
    backdrop: 'https://image.tmdb.org/t/p/original/eSzpy96DwBujGFj0xMbXBcGcfxX.jpg',
    tmdbId: '1396',
    type: 'tv'
  },
  {
    title: 'Oppenheimer',
    backdrop: 'https://image.tmdb.org/t/p/original/hUqG9YF1LOXyG5jHhzS0iFQk2XU.jpg',
    tmdbId: '872585',
    type: 'movie'
  }
];

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
    this.contentService.getTrending().subscribe({
      next: data => this.categories[0].items = data,
      error: err => debugError('Failed to load trending', err),
    });
    this.contentService.getTopRated().subscribe({
      next: data => this.categories[1].items = data,
      error: err => debugError('Failed to load top rated', err),
    });
    this.contentService.getNewReleases().subscribe({
      next: data => this.categories[2].items = data,
      error: err => debugError('Failed to load new releases', err),
    });
    this.watchlistService.getWatchlist().subscribe({
      next: data => this.categories[3].items = data,
      error: err => {
        debugError('Failed to load watchlist', err);
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }
      }
    });
  }

  private loadPublicCategories(): void {
    this.contentService.getTrending().subscribe({
      next: data => this.categories[0].items = data,
      error: err => debugError('Failed to load trending', err),
    });
    this.contentService.getTopRated().subscribe({
      next: data => this.categories[1].items = data,
      error: err => debugError('Failed to load top rated', err),
    });
    this.contentService.getNewReleases().subscribe({
      next: data => this.categories[2].items = data,
      error: err => debugError('Failed to load new releases', err),
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

  toggleWatchlist(contentId: string): void {
    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) {
        this.router.navigate(['/auth/login']);
        return;
      }
      const call = this.isInWatchlist(contentId)
        ? this.watchlistService.removeFromWatchlist(contentId)
        : this.watchlistService.addToWatchlist(contentId);

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
    document.getElementById(categoryId)?.scrollBy({ left: -300, behavior: 'smooth' });
  }

  scrollRight(categoryId: string): void {
    document.getElementById(categoryId)?.scrollBy({ left: 300, behavior: 'smooth' });
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
