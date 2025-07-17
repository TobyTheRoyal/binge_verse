import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { debugError } from '../../core/utils/logger';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss'],
})
export class RatingComponent implements OnInit {
  ratings: any[] = [];
  selectedContentId: number | null = null;
  ratingScore: string = '';
  selectedContentTitle: string = ''; // Neues Feld für den Titel
  apiUrl = `${environment.apiUrl}/ratings`;
  tmdbApiKey = environment.tmdbApiKey;

  constructor(private authService: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.loadRatings();
  }

  loadRatings() {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>(this.apiUrl, { headers }).subscribe({
      next: (data) => {
        this.ratings = data;
        this.enrichWithTmdbData();
      },
      error: (err) => debugError('Failed to load ratings', err),
    });
  }

  enrichWithTmdbData() {
    this.ratings.forEach((rating) => {
      const tmdbUrl = `https://api.themoviedb.org/3/${rating.content.type}/${rating.content.tmdbId}?api_key=${this.tmdbApiKey}`;
      this.http.get<any>(tmdbUrl).subscribe({
        next: (tmdbData) => {
          rating.title = tmdbData.title || tmdbData.name;
          rating.poster = `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`;
        },
        error: (err) => debugError('Failed to load TMDb data', err),
      });
    });
  }

  openRatingModal(contentId: number) {
    this.selectedContentId = contentId;
    const selectedRating = this.ratings.find(r => r.content.id === contentId);
    this.selectedContentTitle = selectedRating ? selectedRating.title : 'Unknown';
    this.ratingScore = selectedRating ? String(selectedRating.score) : '';
  }

  closeRatingModal() {
    this.selectedContentId = null;
    this.selectedContentTitle = '';
  }

  submitRating() {
    const score = parseFloat(this.ratingScore);
    if (isNaN(score) || score < 0 || score > 10) {
      alert('Score must be between 0.0 and 10.0');
      return;
    }
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http
      .post(this.apiUrl, { contentId: this.selectedContentId, score }, { headers })
      .subscribe({
        next: () => {
          this.closeRatingModal();
          this.loadRatings();
        },
        error: (err) => debugError('Failed to submit rating', err),
      });
  }
}