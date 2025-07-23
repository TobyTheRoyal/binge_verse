import { ContentService } from './content.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { Repository } from 'typeorm';
import { Content } from './entities/content.entity';
import { CastMember } from '../cast-member/cast-member.entity';

describe('ContentService.updateHomeCaches', () => {
  let service: ContentService;
  let httpService: { get: jest.Mock };
  const repo = {} as unknown as Repository<Content>;

  beforeEach(() => {
    httpService = { get: jest.fn() } as any;
    service = new ContentService(repo, httpService as unknown as HttpService);
    (service as any).tmdbApiKey = 'k';
    (service as any).omdbApiKey = 'k';
  });

  it('caches items even when detail requests fail', async () => {
    httpService.get.mockImplementation(url => {
      if (url.includes('trending/movie/week')) {
        return of({ data: { results: [{ id: 1, title: 'A', release_date: '2020-01-01', poster_path: '', genre_ids: [], overview: '', original_language: 'en' }] } });
      }
      if (url.includes('/movie/')) {
        throw new Error('fail');
      }
      return of({ data: {} });
    });
    await (service as any).updateHomeCaches();
    const list = await service.getTrending();
    expect(list.length).toBe(1);
  });

  it('keeps null ratings when OMDb fails', async () => {
    httpService.get.mockImplementation(url => {
      if (url.includes('trending/movie/week')) {
        return of({ data: { results: [{ id: 1, title: 'A', release_date: '2020-01-01', poster_path: '', genre_ids: [], overview: '', original_language: 'en' }] } });
      }
      if (url.includes('/movie/1')) {
        return of({ data: { imdb_id: 'tt1' } });
      }
      return of({ data: {} });
    });
    jest.spyOn(service as any, 'fetchOmdbData').mockRejectedValue(new Error('fail'));
    await (service as any).updateHomeCaches();
    const list = await service.getTrending();
    expect(list[0].imdbRating).toBeNull();
    expect(list[0].rtRating).toBeNull();
  });
  it('returns immediately when caches are empty', async () => {
    jest.useFakeTimers();
    let resolved = false;
    jest
      .spyOn<any, any>(service, 'updateHomeCaches')
      .mockImplementation(() => new Promise<void>(r => setTimeout(() => { resolved = true; r(); }, 100)));

    const promise = service.getTrending();
    await Promise.resolve();
    const result = await promise;

    expect(result).toEqual([]);
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(100);
    await Promise.resolve();
    expect(resolved).toBe(true);
    jest.useRealTimers();
  });
});