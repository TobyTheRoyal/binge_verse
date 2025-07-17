import { Injectable, OnModuleInit, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from './entities/content.entity';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, Observable, of, from } from 'rxjs';
import { map, timeout, catchError, mergeMap } from 'rxjs/operators';
import { CastMember } from '../cast-member/cast-member.entity';

export interface FilterOptions {
  genre: string;
  releaseYearMin: number;
  releaseYearMax: number;
  imdbRatingMin: number;
  rtRatingMin: number;
  provider?: string;
}

@Injectable()
export class ContentService implements OnModuleInit {
  private readonly tmdbApiKey = process.env.TMDB_API_KEY!;
  private readonly omdbApiKey = process.env.OMDB_API_KEY!;
  private readonly tmdbBaseUrl = 'https://api.themoviedb.org/3';
  private readonly omdbBaseUrl = 'https://www.omdbapi.com/';

  private readonly logger = new Logger(ContentService.name);

  private cacheTrending: Content[] = [];
  private cacheTopRated: Content[] = [];
  private cacheNewReleases: Content[] = [];
  private genreMap: Map<number, string> = new Map();

  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    private readonly httpService: HttpService,
  ) {}

  async onModuleInit() {
    await this.getGenres();
    this.updateHomeCaches();
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  handleCron() {
    this.updateHomeCaches();
  }

  private async updateHomeCaches() {
    const categories = [
      { key: 'trending', endpoint: 'trending/movie/week', cache: this.cacheTrending },
      { key: 'topRated', endpoint: 'movie/top_rated', cache: this.cacheTopRated },
      { key: 'newReleases', endpoint: 'movie/now_playing', cache: this.cacheNewReleases },
    ];

    for (const { endpoint, cache } of categories) {
      const data = await firstValueFrom(
        this.httpService
          .get(`${this.tmdbBaseUrl}/${endpoint}`, { params: { api_key: this.tmdbApiKey } })
          .pipe(
            map(r => r.data),
            timeout(5000),
            catchError(() => of({ results: [] })),
          ),
      );

      cache.length = 0;
      for (const item of data.results) {
        const content = await this.mapToEntity(item, 'movie');
        const details = await firstValueFrom(
          this.httpService
            .get(`${this.tmdbBaseUrl}/movie/${item.id}`, { params: { api_key: this.tmdbApiKey } })
            .pipe(
              map(r => r.data),
              timeout(5000),
              catchError(() => of({ imdb_id: null })),
            ),
        );

        const omdb = details.imdb_id
          ? await this.fetchOmdbData(details.imdb_id)
          : { imdbRating: null, rtRating: null };
        content.imdbRating = omdb.imdbRating ? parseFloat(omdb.imdbRating) : null;
        content.rtRating = omdb.rtRating ? parseInt(omdb.rtRating.replace('%', ''), 10) : null;
        this.logger.log(`Cached ${content.title} (tmdbId: ${content.tmdbId}): IMDb=${content.imdbRating}, RT=${content.rtRating}`);
        cache.push(content);
      }
    }
  }

  getTrending(): Promise<Content[]> {
    return Promise.resolve(this.cacheTrending);
  }

  getTopRated(): Promise<Content[]> {
    return Promise.resolve(this.cacheTopRated);
  }

  getNewReleases(): Promise<Content[]> {
    return Promise.resolve(this.cacheNewReleases);
  }

  async getMoviesPageWithRt(page: number, filters?: FilterOptions): Promise<Content[]> {
    const params: any = { api_key: this.tmdbApiKey, page };
    if (filters) {
      if (filters.genre) {
        params.with_genres = await this.getGenreId(filters.genre);
      }
      params['primary_release_date.gte'] = `${filters.releaseYearMin}-01-01`;
      params['primary_release_date.lte'] = `${filters.releaseYearMax}-12-31`;
      
    }

    const { results } = await firstValueFrom(
      this.httpService
        .get(`${this.tmdbBaseUrl}/discover/movie`, { params })
        .pipe(
          map(r => r.data),
          catchError(() => of({ results: [] })),
        ),
    );

    return Promise.all(
      results.map(async item => {
        const content = await this.mapToEntity(item, 'movie');
        const details = await firstValueFrom(
          this.httpService
            .get(`${this.tmdbBaseUrl}/movie/${item.id}`, { params: { api_key: this.tmdbApiKey } })
            .pipe(
              map(r => r.data),
              catchError(() => of({ imdb_id: null })),
            ),
        );

        const omdb = details.imdb_id
          ? await this.fetchOmdbData(details.imdb_id)
          : { imdbRating: null, rtRating: null };
        content.imdbRating = omdb.imdbRating ? parseFloat(omdb.imdbRating) : null;
        content.rtRating = omdb.rtRating ? parseInt(omdb.rtRating.replace('%', ''), 10) : null;
        this.logger.log(`Fetched ${content.title} (tmdbId: ${content.tmdbId}): IMDb=${content.imdbRating}, RT=${content.rtRating}`);

        const providers = await this.fetchWatchProviders(item.id, 'movie');

        if (filters?.provider && !providers.includes(filters.provider)) {
          return null;
        }

        // Exclude if rtRating is null and rtRatingMin is set
        if (filters && filters.rtRatingMin > 0 && content.rtRating === null) {
          return null;
        }
        // Exclude if rtRating is below rtRatingMin
        if (filters && filters.rtRatingMin > 0 && content.rtRating !== null && content.rtRating < filters.rtRatingMin) {
          return null;
        }
        // Exclude if imdbRating is below imdbRatingMin
        if (filters && filters.imdbRatingMin > 0 && content.imdbRating !== null && content.imdbRating < filters.imdbRatingMin) {
          return null;
        }

        return content;
      }),
    ).then(results => results.filter((item): item is Content => item !== null));
  }

  async getSeriesPageWithRt(page: number, filters?: FilterOptions): Promise<Content[]> {
    const params: any = { api_key: this.tmdbApiKey, page };
    if (filters) {
      if (filters.genre) {
        params.with_genres = await this.getGenreId(filters.genre);
      }
      params['first_air_date.gte'] = `${filters.releaseYearMin}-01-01`;
      params['first_air_date.lte'] = `${filters.releaseYearMax}-12-31`;
      
    }

    const { results } = await firstValueFrom(
      this.httpService
        .get(`${this.tmdbBaseUrl}/discover/tv`, { params })
        .pipe(
          map(r => r.data),
          catchError(() => of({ results: [] })),
        ),
    );

    return Promise.all(
      results.map(async item => {
        const content = await this.mapToEntity(item, 'tv');
        const details = await firstValueFrom(
          this.httpService
            .get(`${this.tmdbBaseUrl}/tv/${item.id}`, { params: { api_key: this.tmdbApiKey, append_to_response: 'external_ids' } })
            .pipe(
              map(r => r.data),
              catchError(() => of({ external_ids: { imdb_id: null } })),
            ),
        );

        const imdbId = details.imdb_id || details.external_ids?.imdb_id;

        const omdb = imdbId
          ? await this.fetchOmdbData(imdbId)
          : { imdbRating: null, rtRating: null };
        content.imdbRating = omdb.imdbRating ? parseFloat(omdb.imdbRating) : null;
        content.rtRating = omdb.rtRating ? parseInt(omdb.rtRating.replace('%', ''), 10) : null;
        this.logger.log(`Fetched ${content.title} (tmdbId: ${content.tmdbId}): IMDb=${content.imdbRating}, RT=${content.rtRating}`);

        const providers = await this.fetchWatchProviders(item.id, 'tv');

        if (filters?.provider && !providers.includes(filters.provider)) {
          return null;
        }

        // Exclude if rtRating is null and rtRatingMin is set
        if (filters && filters.rtRatingMin > 0 && content.rtRating === null) {
          return null;
        }
        // Exclude if rtRating is below rtRatingMin
        if (filters && filters.rtRatingMin > 0 && content.rtRating !== null && content.rtRating < filters.rtRatingMin) {
          return null;
        }
        // Exclude if imdbRating is below imdbRatingMin
        if (filters && filters.imdbRatingMin > 0 && content.imdbRating !== null && content.imdbRating < filters.imdbRatingMin) {
          return null;
        }

        return content;
      }),
    ).then(results => results.filter((item): item is Content => item !== null));
  }

  async getGenres(): Promise<string[]> {
    const { data } = await axios.get(`${this.tmdbBaseUrl}/genre/movie/list`, {
      params: { api_key: this.tmdbApiKey },
    });
    this.genreMap = new Map(
      data.genres.map((g: any) => [g.id, g.name] as [number, string]),
    );
    return data.genres.map((genre: any) => genre.name);
  }

  private async getGenreId(genreName: string): Promise<string> {
    if (this.genreMap.size === 0) {
      await this.getGenres();
    }
    for (const [id, name] of this.genreMap.entries()) {
      if (name === genreName) {
        return id.toString();
      }
    }
    return '';
  }

  private async mapToEntity(
    item: any,
    mediaType: 'movie' | 'tv',
  ): Promise<Content> {
    const c = new Content();
    c.tmdbId = item.id.toString();
    c.type = mediaType;
    c.title = mediaType === 'movie' ? item.title : item.name;
    const dateStr = mediaType === 'movie' ? item.release_date : item.first_air_date;
    c.releaseYear = dateStr ? parseInt(dateStr.slice(0, 4), 10) : 0;
    c.poster = item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : 'https://placehold.co/200x300';
    c.imdbRating = null;
    c.rtRating = null;
    c.genres = item.genre_ids
      ? await Promise.all(
          item.genre_ids.map((id: number) => this.getGenreName(id)),
        )
      : item.genres?.map((g: any) => g.name) || [];
    c.overview = item.overview || '';
    c.cast = [];
    c.language = item.original_language || 'en';
    c.providers = await this.fetchWatchProviders(c.tmdbId, mediaType);
    return c;
  }

  private async getGenreName(genreId: number): Promise<string> {
    if (this.genreMap.size === 0) {
      await this.getGenres();
    }
    return this.genreMap.get(genreId) || '';
  }

  private async fetchOmdbData(imdbId: string): Promise<{ imdbRating: string | null; rtRating: string | null }> {
    try {
      const { data } = await axios.get(this.omdbBaseUrl, {
        params: { i: imdbId, apikey: this.omdbApiKey },
      });
      const rtRating = data.Ratings?.find((r: any) => r.Source === 'Rotten Tomatoes')?.Value || null;
      this.logger.log(`OMDB for ${imdbId}: Raw IMDb=${data.imdbRating}, Raw RT=${rtRating}, Parsed IMDb=${data.imdbRating ? parseFloat(data.imdbRating) : null}, Parsed RT=${rtRating ? parseInt(rtRating.replace('%', ''), 10) : null}`);
      return {
        imdbRating: data.imdbRating || null,
        rtRating,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch OMDB data for ${imdbId}: ${error}`);
      return { imdbRating: null, rtRating: null };
    }
  }

  private async fetchWatchProviders(tmdbId: string, mediaType: 'movie' | 'tv'): Promise<string[]> {
    try {
      const { data } = await axios.get(
        `${this.tmdbBaseUrl}/${mediaType}/${tmdbId}/watch/providers`,
        { params: { api_key: this.tmdbApiKey } },
      );
      const providers: string[] = [];
      const region = data.results?.AT;
      if (region) {
        for (const key of ['flatrate', 'rent', 'buy']) {
          if (region[key]) {
            for (const p of region[key]) {
              if (!providers.includes(p.provider_name)) {
                providers.push(p.provider_name);
              }
            }
          }
        }
      }
      return providers;
    } catch (error) {
      this.logger.error(`Failed to fetch watch providers for ${tmdbId}: ${error}`);
      return [];
    }
  }

  searchTmdb(query: string): Observable<Content[]> {
    if (!query.trim()) {
      return new Observable<Content[]>(obs => {
        obs.next([]);
        obs.complete();
      });
    }
    return this.httpService
      .get<{ results: any[] }>(`${this.tmdbBaseUrl}/search/movie`, {
        params: { api_key: this.tmdbApiKey, query },
      })
      .pipe(
        mergeMap(resp =>
          from(
            Promise.all(
              resp.data.results.map(item => this.mapToEntity(item, 'movie')),
            ),
          ),
        ),
      );
  }

  async addFromTmdb(tmdbId: string, type: 'movie' | 'tv'): Promise<Content> {
    const endpoint = type === 'movie' ? `movie/${tmdbId}` : `tv/${tmdbId}`;
    const { data } = await axios.get(`${this.tmdbBaseUrl}/${endpoint}`, {
      params: { api_key: this.tmdbApiKey, append_to_response: type === 'movie' ? 'credits' : 'aggregate_credits' },
    });
    const omdb = data.imdb_id ? await this.fetchOmdbData(data.imdb_id) : { imdbRating: null, rtRating: null };
    const genresName: string[] = data.genres.map((g: any) => g.name);
    const rawCast = type === 'movie' ? data.credits.cast : data.aggregate_credits.cast;
    this.logger.log(
      'TMDB cast data: ' +
        JSON.stringify(rawCast.slice(0, 10).map((c: any) => ({ id: c.id, name: c.name }))),
    );
    const castMembers: CastMember[] = (rawCast || []).slice(0, 10).map((c: any) => {
      const cm = new CastMember();
      cm.tmdbId = c.id;
      cm.name = c.name;
      cm.character = type === 'movie' ? c.character : c.roles?.[0]?.character || '';
      cm.profilePathUrl = c.profile_path
        ? `https://image.tmdb.org/t/p/w200${c.profile_path}`
        : 'https://placehold.co/80x120';
      this.logger.log(`Mapped CastMember: ${JSON.stringify({ tmdbId: cm.tmdbId, name: cm.name })}`);
      return cm;
    });

    const rawDate = type === 'movie' ? data.release_date : data.first_air_date;
    const year = rawDate ? parseInt(rawDate.slice(0, 4), 10) : 0;
    const providers = await this.fetchWatchProviders(tmdbId, type);
    const entity = this.contentRepository.create({
      tmdbId,
      type,
      title: data.title || data.name,
      releaseYear: year,
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : 'https://placehold.co/200x300',
      imdbRating: omdb.imdbRating ? parseFloat(omdb.imdbRating) : null,
      rtRating: omdb.rtRating ? parseInt(omdb.rtRating.replace('%', ''), 10) : null,
      genres: genresName,
      overview: data.overview,
      cast: castMembers,
      language: data.original_language || 'en',
      providers,
    });
    return this.contentRepository.save(entity);
  }

  findAll(): Promise<Content[]> {
    return this.contentRepository.find();
  }

  findById(id: number): Promise<Content | null> {
    return this.contentRepository.findOne({ where: { id } });
  }

  findByTmdbId(tmdbId: string): Promise<Content | null> {
    return this.contentRepository.findOne({ where: { tmdbId } });
  }

  async searchAll(query: string): Promise<Content[]> {
    const { data } = await axios.get(`${this.tmdbBaseUrl}/search/multi`, {
      params: { api_key: this.tmdbApiKey, query },
    });
    const items = data.results.filter(
      (r: any) => r.media_type === 'movie' || r.media_type === 'tv',
    );
    return Promise.all(
      items.map(item =>
        this.mapToEntity(item, item.media_type === 'tv' ? 'tv' : 'movie'),
      ),
    );
  }
}