// src/app/core/services/ratings.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface Rating {
  tmdbId: string;
  score: number;
}

@Injectable({ providedIn: 'root' })
export class RatingsService {
  private apiUrl = `${environment.apiUrl}/ratings`;
  private ratingsCache: Rating[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /** Ratings neu laden */
  fetchUserRatings(): Observable<Rating[]> {
    const token = this.authService.getToken();
    if (!token) return of([]);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http
      .get<any[]>(this.apiUrl, { headers })
      .pipe(
        tap(res => {
          // Mappe DB-Antwort (mit content.tmdbId) in unser Cache-Format
          this.ratingsCache = res.map(r => ({
            tmdbId: r.content.tmdbId,
            score:  r.score
          }));
        }),
        catchError(() => of([]))
      );
  }

  /** Neues Rating absenden */
  rateContent(tmdbId: string, score: number): Observable<any> {
    const token = this.authService.getToken();
    if (!token) return of(null);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const body = { tmdbId, score };
    return this.http
      .post(this.apiUrl, body, { headers })
      .pipe(
        tap(() => {
          // im Cache aktualisieren
          const idx = this.ratingsCache.findIndex(r => r.tmdbId === tmdbId);
          if (idx >= 0) this.ratingsCache[idx].score = score;
          else          this.ratingsCache.push({ tmdbId, score });
        }),
        catchError(() => of(null))
      );
  }

  /** Rating aus Cache holen */
  getRating(tmdbId: string): number | null {
    const r = this.ratingsCache.find(r => r.tmdbId === tmdbId);
    return r ? r.score : null;
  }
}
