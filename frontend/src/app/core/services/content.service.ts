import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CastMember, Content } from '../../interfaces/content.interface';
import { FilterOptions } from '../../core/services/filter.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  private apiUrl = environment.apiUrl;


  constructor(private http: HttpClient) {}

  getTrending(): Observable<Content[]> {
    return this.http.get<Content[]>(`${this.apiUrl}/content/trending`);
  }

  getTopRated(): Observable<Content[]> {
    return this.http.get<Content[]>(`${this.apiUrl}/content/top-rated`);
  }

  getNewReleases(): Observable<Content[]> {
    return this.http.get<Content[]>(`${this.apiUrl}/content/new-releases`);
  }

  getAllMovies(pages: number = 5): Observable<Content[]> {
    const requests: Observable<Content[]>[] = [];
    for (let page = 1; page <= pages; page++) {
      requests.push(
        this.http.get<Content[]>(`${this.apiUrl}/content/movies-page`, {
          params: { page: page.toString() },
        })
      );
    }
    return forkJoin(requests).pipe(map(responses => responses.flat()));
  }

  getAllMoviesCached(page: number = 1): Observable<Content[]> {
    return this.http.get<Content[]>(
      `${this.apiUrl}/content/movies-page`,
      { params: { page: page.toString() } }
    );
  }

  getAllSeriesCached(page: number = 1): Observable<Content[]> {
    return this.http.get<Content[]>(
      `${this.apiUrl}/content/series-page`,
      { params: { page: page.toString() } }
    );
  }

  getGenres(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/content/genres`);
  }

  getFilteredMovies(filters: FilterOptions, page: number = 1): Observable<Content[]> {
    const params: any = {
      page: page.toString(),
      genre: filters.genres.join(','),
      releaseYearMin: filters.releaseYearMin.toString(),
      releaseYearMax: filters.releaseYearMax.toString(),
      imdbRatingMin: filters.imdbRatingMin.toString(),
      rtRatingMin: filters.rtRatingMin.toString(),
    };

    if (filters.providers.length) {
      params.provider = filters.providers.join(',');
    }

    return this.http.get<Content[]>(`${this.apiUrl}/content/movies-page`, { params });
  }

  getFilteredSeries(filters: FilterOptions, page: number = 1): Observable<Content[]> {
    const params: any = {
      page: page.toString(),
      genre: filters.genres.join(','),
      releaseYearMin: filters.releaseYearMin.toString(),
      releaseYearMax: filters.releaseYearMax.toString(),
      imdbRatingMin: filters.imdbRatingMin.toString(),
      rtRatingMin: filters.rtRatingMin.toString(),
    };

    if (filters.providers.length) {
      params.provider = filters.providers.join(',');
    }

    return this.http.get<Content[]>(`${this.apiUrl}/content/series-page`, { params });
  }


  getMoviesPage(page: number): Observable<Content[]> {
    return this.http.get<Content[]>(`${this.apiUrl}/content/movies-page`, {
      params: { page: page.toString() },
    });
  }

  searchTmdb(query: string): Observable<Content[]> {
    if (!query.trim()) {
      return of([]);
    }
    return this.http.post<Content[]>(
      `${this.apiUrl}/content/search`,
      { query }
    );
  }

  getMovieDetails(tmdbId: string): Observable<Content> {
    return this.http.post<Content>(
      `${this.apiUrl}/content/add-tmdb`,
      { tmdbId, type: 'movie' }
    );
  }

  getSeriesDetails(tmdbId: string): Observable<Content> {
    return this.http.post<Content>(
      `${this.apiUrl}/content/add-tmdb`,
      { tmdbId, type: 'tv' }
    );
  }
}