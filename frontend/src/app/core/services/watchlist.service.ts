import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Content } from '../../interfaces/content.interface';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { debugError, debugLog } from '../utils/logger';

@Injectable({
  providedIn: 'root',
})
export class WatchlistService {
  private apiUrl = `${environment.apiUrl}/watchlist`;
  private watchlist: Content[] = [];

  constructor(private http: HttpClient, private authService: AuthService) {}

  getWatchlist(): Observable<Content[]> {
    const token = this.authService.getToken();
    if (!token) {
      debugLog('No token, skipping watchlist request');
      return of([]);
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<Content[]>(`${this.apiUrl}/user`, { headers }).pipe(
      tap((data) => (this.watchlist = data)),
      catchError(this.handleError<Content[]>('getWatchlist', []))
    );
  }

  addToWatchlist(contentId: string, type: 'movie' | 'tv'): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      return of(null);
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http
      .post(`${this.apiUrl}/add`, { tmdbId: contentId, type }, { headers })
      .pipe(
        tap(() => {
          const exists = this.watchlist.some(c => c.tmdbId === contentId);
          if (!exists) {
             this.watchlist.push({ tmdbId: contentId, type } as Content);
            }
        }),
        catchError(this.handleError<any>('addToWatchlist'))
      );
  }

  removeFromWatchlist(contentId: string): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      return of(null);
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http
      .delete(`${this.apiUrl}/user/${contentId}`, { headers })
      .pipe(
        tap(() => {
          this.watchlist = this.watchlist.filter(c => c.tmdbId !== contentId);
        }),
        catchError(this.handleError<any>('removeFromWatchlist'))
      );
  }

  setRating(contentId: string, rating: number): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      debugLog('No token, skipping rating request');
      return of(null);
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http
      .post(`${this.apiUrl}/rate`, { tmdbId: contentId, rating }, { headers })
      .pipe(
        tap(() => {
          const item = this.watchlist.find((content) => content.tmdbId === contentId);
          if (item) {
            item.rating = rating;
          }
        }),
        catchError(this.handleError<any>('setRating'))
      );
  }

  getRating(contentId: string): number | null {
    const item = this.watchlist.find((content) => content.tmdbId === contentId);
    return item && item.rating !== undefined ? item.rating : item?.imdbRating || null;
  }

  isInWatchlist(contentId: string): boolean {
    return this.watchlist.some((content) => content.tmdbId === contentId);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      debugError(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}