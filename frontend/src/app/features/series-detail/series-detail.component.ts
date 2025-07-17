import { Component, OnInit }           from '@angular/core';
import { CommonModule }                from '@angular/common';
import { ActivatedRoute, Router }              from '@angular/router';
import { ContentService }              from '../../core/services/content.service';
import { Content }                     from '../../interfaces/content.interface';
import { WatchlistService } from '../../core/services/watchlist.service';
import { RatingsService } from '../../core/services/ratings.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { providerLogoMap } from '../../shared/provider-logos';
import { debugError } from '../../core/utils/logger';

@Component({
  selector: 'app-series-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './series-detail.component.html',
  styleUrls: ['./series-detail.component.scss']
})
export class SeriesDetailComponent implements OnInit {
  series: Content | null = null;
  isLoading = true;
  isInWL                        = false;

  // Rate‐Overlay
  selectedContentId: string | null = null;
  ratingScore            = '';
  isRatingSubmitted      = false;

  // Eigenes Rating
  userRating: number | null = null;

  readonly providerLogoMap = providerLogoMap;

  constructor(
    private route: ActivatedRoute,
    private contentService: ContentService,
    private router: Router,
    private watchlist: WatchlistService,
    private ratings: RatingsService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    const tmdbId = this.route.snapshot.paramMap.get('id')!;
    this.contentService.getSeriesDetails(tmdbId).subscribe({
      next: s => {
        this.series = s;
        this.isLoading = false;
        // Watchlist‐Cache laden
        this.watchlist.getWatchlist().subscribe(list =>
          this.isInWL = list.some(c => c.tmdbId === tmdbId)
        );
        // Rating‐Cache laden
        this.ratings.fetchUserRatings().subscribe(() =>
          this.userRating = this.ratings.getRating(tmdbId)
        );
      },
      error: () => this.isLoading = false
    });
  }
  toggleWatchlist() {
    this.auth.isLoggedIn().subscribe(loggedIn => {
      if (!loggedIn) {
        this.router.navigate(['/auth/login']);
        return;
      }
      if (!this.series) return;
      const id = this.series.tmdbId;
      const op = this.isInWL
        ? this.watchlist.removeFromWatchlist(id)
        : this.watchlist.addToWatchlist(id, 'tv');
      op.subscribe({
        next: res => {
          if (res !== null && res !== undefined) {
            this.isInWL = !this.isInWL;
          }
        },
        error: err => debugError('Failed to toggle watchlist', err),
      });
    });
  }

  onClickRateButton() {
    this.auth.isLoggedIn().subscribe(loggedIn => {
      if (!loggedIn) {
        this.router.navigate(['/auth/login']);
      } else if (this.series) {
        this.selectedContentId = this.series.tmdbId;
        this.ratingScore      = '';
        this.isRatingSubmitted = false;
      }
    });
  }

  submitRating() {
    if (!this.series) return;
    const score = parseFloat(this.ratingScore);
    if (isNaN(score) || score < 0 || score > 10) {
      alert('Score must be between 0.0 and 10.0');
      return;
    }
    this.ratings.rateContent(this.series.tmdbId, score).subscribe({
      next: () => {
        this.isRatingSubmitted = true;
        this.ratings.fetchUserRatings().subscribe(() =>
          this.userRating = this.ratings.getRating(this.series!.tmdbId)
        );
        setTimeout(() => this.selectedContentId = null, 500);
      },
      error: err => debugError('Failed to set rating', err)
    });
  }

  cancelRating() {
    this.selectedContentId = null;
    this.ratingScore      = '';
    this.isRatingSubmitted = false;
  }

  getKnownProviders(providers: string[] | undefined): string[] {
    return (providers || []).filter(p => this.providerLogoMap[p]);
  }

  getProviderLogoPath(provider: string): string | null {
    const file = this.providerLogoMap[provider];
    return file ? '/assets/images/providers/' + file : null;
  }
}