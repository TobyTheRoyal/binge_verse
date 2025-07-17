import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import { ContentService } from '../../core/services/content.service';
import { FilterOptions } from '../../core/services/filter.service';
import { debugError } from '../../core/utils/logger';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-filter-controls',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSliderModule],
  templateUrl: './filter-controls.component.html',
  styleUrls: ['./filter-controls.component.scss']
})
export class FilterControlsComponent implements OnInit, OnChanges {
  @Input() genresSelected: string[] = [];
  @Input() releaseYearMin = 1900;
  @Input() releaseYearMax = new Date().getFullYear();
  @Input() imdbRatingMin = 0;
  @Input() rtRatingMin = 0;
  @Input() userRatingMin = 0;
  @Input() currentYear = new Date().getFullYear();
  @Input() providersSelected: string[] = [];

  genres: string[] = [];
  readonly providers = [
    'Netflix',
    'Disney Plus',
    'Apple TV+',
    'Amazon Prime Video',
    'Paramount Plus',
    'Sky Go'
  ];

  private readonly providerLogoMap: Record<string, string> = {
    'Netflix': 'netflix.svg',
    'Disney Plus': 'disney-plus.svg',
    'Apple TV+': 'apple-tv.svg',
    'Amazon Prime Video': 'prime.svg',
    'Paramount Plus': 'paramount.svg',
    'Sky Go': 'sky.svg'
  };

  sliderOptions: Options = {
    floor: 1900,
    ceil: this.currentYear,
    step: 1,
    translate: (value: number) => `${value}`
  };

  @Output() filtersChange = new EventEmitter<Partial<FilterOptions>>();
  @Output() reset = new EventEmitter<void>();

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.loadGenres();
    this.sliderOptions.ceil = this.currentYear;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentYear']) {
      this.sliderOptions = { ...this.sliderOptions, ceil: this.currentYear };
    }
    if (changes['genresSelected'] || changes['imdbRatingMin'] || changes['rtRatingMin'] || changes['userRatingMin'] || changes['releaseYearMin'] || changes['releaseYearMax'] || changes['providersSelected']) {
      this.emitChange();
    }
  }

  loadGenres(): void {
    this.contentService.getGenres().subscribe({
      next: g => this.genres = g,
      error: () => debugError('Failed to load genres')
    });
  }

  toggleGenre(genre: string): void {
    if (this.genresSelected.includes(genre)) {
      this.genresSelected = this.genresSelected.filter(g => g !== genre);
    } else {
      this.genresSelected = [...this.genresSelected, genre];
    }
    this.emitChange();
  }

  clearGenres(): void {
    this.genresSelected = [];
    this.emitChange();
  }

  toggleProvider(provider: string): void {
    if (this.providersSelected.includes(provider)) {
      this.providersSelected = this.providersSelected.filter(p => p !== provider);
    } else {
      this.providersSelected = [...this.providersSelected, provider];
    }
    this.emitChange();
  }

  clearProviders(): void {
    this.providersSelected = [];
    this.emitChange();
  }

  emitChange(): void {
    this.filtersChange.emit({
      genres: this.genresSelected,
      releaseYearMin: Number(this.releaseYearMin),
      releaseYearMax: Number(this.releaseYearMax),
      imdbRatingMin: Number(this.imdbRatingMin),
      rtRatingMin: Number(this.rtRatingMin),
      providers: this.providersSelected,
      userRatingMin: Number(this.userRatingMin)
    });
  }

  triggerRipple(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const ripple = target.querySelector('.ripple') as HTMLElement;
    if (!ripple) return;

    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

    ripple.classList.add('animate');
    setTimeout(() => ripple.classList.remove('animate'), 600);
  }

  hasActiveFilters(): boolean {
    return (
      this.genresSelected.length > 0 ||
      this.releaseYearMin !== 1900 ||
      this.releaseYearMax !== this.currentYear ||
      this.imdbRatingMin > 0 ||
      this.rtRatingMin > 0 ||
      this.userRatingMin > 0 ||
      this.providersSelected.length > 0
    );
  }

  resetFilters(): void {
    this.genresSelected = [];
    this.releaseYearMin = 1900;
    this.releaseYearMax = this.currentYear;
    this.imdbRatingMin = 0;
    this.rtRatingMin = 0;
     this.userRatingMin = 0;
    this.providersSelected = [];
    this.emitChange();
    this.reset.emit();
  }

  getProviderLogoPath(provider: string): string {
    const file = this.providerLogoMap[provider];
    return '/assets/images/providers/' + file;
  }
}