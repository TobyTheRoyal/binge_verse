
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap
} from 'rxjs/operators';

import { AuthService } from '../core/services/auth.service';
import { ContentService } from '../core/services/content.service';
import { Content } from '../interfaces/content.interface';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  isScrolled = false;
  isDropdownOpen = false;

  // Search
  searchControl = new FormControl('');
  suggestions: Content[] = [];

  private loginSub!: Subscription;
  private searchSub!: Subscription;

  constructor(
    private authService: AuthService,
    private contentService: ContentService,
    private router: Router
  ) {}

  ngOnInit() {
    // Auth status
    this.loginSub = this.authService.isLoggedIn().subscribe(status => {
      this.isLoggedIn = status;
    });

    // Scroll listener
    window.addEventListener('scroll', this.onWindowScroll);

    // Type-ahead search
    this.searchSub = this.searchControl.valueChanges.pipe(
      filter((q): q is string => typeof q === 'string' && q.length > 1),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => this.contentService.searchTmdb(q))
    ).subscribe(results => {
      this.suggestions = results;
    });
  }

  ngOnDestroy() {
    this.loginSub?.unsubscribe();
    this.searchSub?.unsubscribe();
    window.removeEventListener('scroll', this.onWindowScroll);
  }

  // Scroll handler
  private onWindowScroll = () => {
    this.isScrolled = window.scrollY > 50;
  };

  // Dropdown
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  closeDropdown() {
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Dropdown schließen wie gehabt
    if (!target.closest('.profile-dropdown')) {
      this.closeDropdown();
    }

    // 2) Vorschläge löschen, wenn Klick NICHT in .search-container
    if (!target.closest('.search-container')) {
      this.clearSuggestions();
    }
  
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
    this.closeDropdown();
  }

  // When user selects a suggestion
  selectSuggestion(item: Content) {
    if (item.type === 'movie') {
    this.router.navigate(['/movies', item.tmdbId]);
  } else {
    this.router.navigate(['/series', item.tmdbId]);
  }
  this.suggestions = [];
  this.searchControl.setValue('');
  }

  clearSuggestions() {
    this.suggestions = [];
  }
}