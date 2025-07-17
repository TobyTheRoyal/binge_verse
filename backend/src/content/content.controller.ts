import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ContentService } from './content.service';
import { Content } from './entities/content.entity';

@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Get('trending')
  async getTrending() {
    return this.contentService.getTrending();
  }

  @Get('top-rated')
  async getTopRated() {
    return this.contentService.getTopRated();
  }

  @Get('new-releases')
  async getNewReleases() {
    return this.contentService.getNewReleases();
  }

  @Post('add-tmdb')
  async addFromTmdb(@Body() body: { tmdbId: string; type: 'movie' | 'tv' }) {
    return this.contentService.addFromTmdb(body.tmdbId, body.type);
  }

  @Post('search')
  async searchAll(@Body() body: { query: string }) {
    return this.contentService.searchAll(body.query);
  }

  @Get('movies-page')
  async getMoviesPageWithRt(
    @Query('page') page = '1',
    @Query('genre') genre?: string,
    @Query('releaseYearMin') releaseYearMin?: string,
    @Query('releaseYearMax') releaseYearMax?: string,
    @Query('imdbRatingMin') imdbRatingMin?: string,
    @Query('rtRatingMin') rtRatingMin?: string,
    @Query('provider') provider?: string,
  ): Promise<Content[]> {
    const p = parseInt(page, 10) || 1;
    const filters = {
      genre: genre || '',
      releaseYearMin: releaseYearMin ? parseInt(releaseYearMin, 10) : 1900,
      releaseYearMax: releaseYearMax ? parseInt(releaseYearMax, 10) : new Date().getFullYear(),
      imdbRatingMin: imdbRatingMin ? parseFloat(imdbRatingMin) : 0,
      rtRatingMin: rtRatingMin ? parseInt(rtRatingMin, 10) : 0,
      provider,
    };
    return this.contentService.getMoviesPageWithRt(p, filters);
  }

  @Get('series-page')
  async getSeriesPageWithRt(
    @Query('page') page = '1',
    @Query('genre') genre?: string,
    @Query('releaseYearMin') releaseYearMin?: string,
    @Query('releaseYearMax') releaseYearMax?: string,
    @Query('imdbRatingMin') imdbRatingMin?: string,
    @Query('rtRatingMin') rtRatingMin?: string,
    @Query('provider') provider?: string,
  ): Promise<Content[]> {
    const p = parseInt(page, 10) || 1;
    const filters = {
      genre: genre || '',
      releaseYearMin: releaseYearMin ? parseInt(releaseYearMin, 10) : 1900,
      releaseYearMax: releaseYearMax ? parseInt(releaseYearMax, 10) : new Date().getFullYear(),
      imdbRatingMin: imdbRatingMin ? parseFloat(imdbRatingMin) : 0,
      rtRatingMin: rtRatingMin ? parseInt(rtRatingMin, 10) : 0,
      provider,
    };
    return this.contentService.getSeriesPageWithRt(p, filters);
  }

  @Get ('genres') 
  async getGenres(): Promise<string[]> {
    return this.contentService.getGenres();
  }

  @Get()
  async findAll() {
    return this.contentService.findAll();
  }
}