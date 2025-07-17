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
  private tmdbApiUrl = environment.tmdbApiUrl;
  private apiKey = environment.tmdbApiKey;

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
    const requests: Observable<{ results: any[] }>[] = [];
    for (let page = 1; page <= pages; page++) {
      requests.push(
        this.http.get<{ results: any[] }>(
          `${this.tmdbApiUrl}/discover/movie`,
          { params: { api_key: this.apiKey, page: page.toString() } }
        )
      );
    }
    return forkJoin(requests).pipe(
      map(responses =>
        responses.flatMap(resp => resp.results.map(item => this.mapToContent(item)))
      )
    );
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
    return this.http.get<{ genres: { id: number; name: string }[] }>(
      `${this.tmdbApiUrl}/genre/movie/list`,
      { params: { api_key: this.apiKey } }
    ).pipe(
      map(response => response.genres.map(genre => genre.name))
    );
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
  
  private getGenreId(genreName: string): string {
    const genreMap: { [key: string]: string } = {
      Action: '28',
      Adventure: '12',
      Animation: '16',
      Comedy: '35',
      Crime: '80',
      Documentary: '99',
      Drama: '18',
      Family: '10751',
      Fantasy: '14',
      History: '36',
      Horror: '27',
      Music: '10402',
      Mystery: '9648',
      Romance: '10749',
      'Science Fiction': '878',
      'TV Movie': '10770',
      Thriller: '53',
      War: '10752',
      Western: '37',
    };
    return genreMap[genreName] || '';
  }

  getMoviesPage(page: number): Observable<Content[]> {
    return this.http.get<{ results: any[] }>(
      `${this.tmdbApiUrl}/discover/movie`,
      { params: { api_key: this.apiKey, page: page.toString() } }
    ).pipe(
      map(resp => resp.results.map(item => this.mapToContent(item)))
    );
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

  private mapToContent(item: any): Content {
    const rawDate = item.release_date ?? item.first_air_date ?? '';
    const releaseYear = rawDate ? parseInt(rawDate.slice(0, 4), 10) : 0;

    const parseRating = (val: any): number | null => {
      if (val === undefined || val === null || val === 'N/A') {
        return null;
      }
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };


    return {
      id: item.id,
      tmdbId: item.id.toString(),
      title: item.title || item.name,
      releaseYear,
      poster: item.poster_path
        ? 'https://image.tmdb.org/t/p/w500' + item.poster_path
        : 'https://placehold.co/200x300',
      type: item.title ? 'movie' : 'tv',
      imdbRating: parseRating(item.imdbRating),
      rtRating: parseRating(item.rtRating),
      rating: item.rating,
      genres: item.genres || [],
      overview: item.overview,
      cast: (item.cast || []).map((c: any) => ({
        tmdbId: c.tmdbId ?? c.id ?? 0, // Fallback to id or 0
        name: c.name,
        character: c.character,
        profilePathUrl: c.profilePathUrl,
      })),
      language: item.original_language || 'en',
    };
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