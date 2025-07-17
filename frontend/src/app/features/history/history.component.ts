// src/app/features/history/history.component.ts
import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { Router, RouterModule }   from '@angular/router';
import { FormsModule }    from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService }    from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { debugError } from '../../core/utils/logger';
import { FilterService, FilterOptions } from '../../core/services/filter.service';
import { Subscription } from 'rxjs';
import { FilterControlsComponent } from '../filter-controls/filter-controls.component';

interface RatedContent {
  content: {
    tmdbId: string;
    title?: string;
    poster?: string;
    releaseYear?: number;
    imdbRating?: number;   // <-- neu
    rtRating?: number;     // <-- neu
    genres?: string;
    providers?: string;
  };
  score: number;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FilterControlsComponent],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit, OnDestroy {
  history: RatedContent[] = [];
  filteredHistory: RatedContent[] = [];
  selectedContentId: string | null = null;
  ratingScore = '';
  isRatingSubmitted = false;
  private ratingsApi = `${environment.apiUrl}/ratings`;

  currentYear = new Date().getFullYear();
  genres: string[] = [];
  releaseYearMin: number = 1900;
  releaseYearMax: number = this.currentYear;
  imdbRatingMin: number = 0;
  rtRatingMin: number = 0;
  providers: string[] = [];
  userRatingMin: number = 0;
  showFilters = false;

  private filterServiceSub?: Subscription;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private filterService: FilterService,
  ) {}

  ngOnInit() {
    this.loadHistory();
    this.filterServiceSub = this.filterService.currentFilters.subscribe(f => {
      this.genres = f.genres;
      this.releaseYearMin = f.releaseYearMin;
      this.releaseYearMax = f.releaseYearMax;
      this.imdbRatingMin = f.imdbRatingMin;
      this.rtRatingMin = f.rtRatingMin;
      this.providers = f.providers;
      this.userRatingMin = f.userRatingMin ?? 0;
      this.applyFilters();
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadHistory() {
    this.http
      .get<RatedContent[]>(this.ratingsApi, { headers: this.getHeaders() })
      .subscribe({
        next: data => { this.history = data; this.applyFilters(); },
        error: err => debugError('Failed to load history', err),
      });
  }

  startRating(tmdbId: string) {
    this.selectedContentId = tmdbId;
    this.ratingScore = '';
    this.isRatingSubmitted = false;
    setTimeout(() => {
      const input = document.querySelector('.rating-input-field') as HTMLElement;
      if (input) input.focus();
    }, 0);
  }

  stopRating() {
    this.selectedContentId = null;
    this.isRatingSubmitted = false;
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

  @HostListener('document:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
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
      if (parseFloat(this.ratingScore) > 10) this.ratingScore = '10';
    } else if (event.key === '.') {
      if (!this.ratingScore.includes('.') && this.ratingScore !== '') {
        this.ratingScore += '.';
      }
    } else if (event.key === 'Enter') {
      this.submitRating(this.selectedContentId);
    }
  }

  submitRating(tmdbId: string) {
    const score = parseFloat(this.ratingScore);
    if (isNaN(score) || score < 0 || score > 10) {
      alert('Score must be 0.0–10.0');
      return;
    }
    this.http
      .post(this.ratingsApi, { tmdbId, score }, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          this.isRatingSubmitted = true;
          this.loadHistory();   // neu laden, damit externes Rating & Badge updaten
          setTimeout(() => this.stopRating(), 500);
        },
        error: err => debugError('Failed to rate', err),
      });
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
    if (newFilters.userRatingMin !== undefined) {
      updated.userRatingMin = Number(newFilters.userRatingMin);
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
      userRatingMin: 0
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
      (f.userRatingMin ?? 0) > 0 ||
      f.providers.length > 0
    );
  }

  private applyFilters(): void {
    const f = this.filterService.getFilters();
    this.filteredHistory = this.history.filter(h => {
      const c = h.content;
      if (f.genres.length > 0) {
        const contentGenres = c.genres?.split(',').map(g => g.trim()) ?? [];
        if (!f.genres.some(g => contentGenres.includes(g))) return false;
      }
      if (f.providers.length > 0) {
        const contentProviders = c.providers?.split(',').map(p => p.trim()) ?? [];
        if (!f.providers.some(p => contentProviders.includes(p))) return false;
      }
      const year = c.releaseYear ?? 0;
      if (year < f.releaseYearMin || year > f.releaseYearMax) return false;
      if (f.imdbRatingMin > 0) {
        if (c.imdbRating == null || c.imdbRating < f.imdbRatingMin) return false;
      }
      if (f.rtRatingMin > 0) {
        if (c.rtRating == null || c.rtRating < f.rtRatingMin) return false;
      }
      if (f.userRatingMin && f.userRatingMin > 0) {
        if (h.score == null || h.score < f.userRatingMin) return false;
      }
      return true;
    });
  }

  ngOnDestroy(): void {
    this.filterServiceSub?.unsubscribe();
  }
}
