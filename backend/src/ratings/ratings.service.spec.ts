import { RatingService } from './ratings.service';
import { Repository } from 'typeorm';
import { Rating } from './entities/ratings.entity';
import { Content } from '../content/entities/content.entity';
import { User } from '../users/entities/user.entity';

describe('RatingService.rateContent', () => {
  let service: RatingService;
  let ratingRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let contentRepo: { findOne: jest.Mock };
  let contentService: { addFromTmdb: jest.Mock };
  const user = { id: 1 } as User;

  beforeEach(() => {
    ratingRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    contentRepo = { findOne: jest.fn() };
    contentService = { addFromTmdb: jest.fn() };
    service = new RatingService(
      ratingRepo as unknown as Repository<Rating>,
      contentRepo as unknown as Repository<Content>,
      contentService as any,
    );
  });

  it('creates content as movie when available', async () => {
    contentRepo.findOne.mockResolvedValueOnce(null);
    const content = { id: 2 } as Content;
    contentService.addFromTmdb.mockResolvedValueOnce(content);
    ratingRepo.findOne.mockResolvedValueOnce(null);
    ratingRepo.create.mockReturnValue({} as Rating);
    ratingRepo.save.mockResolvedValue({} as Rating);

    await service.rateContent(user, '10', 5);

    expect(contentService.addFromTmdb).toHaveBeenCalledWith('10', 'movie');
    expect(contentService.addFromTmdb).toHaveBeenCalledTimes(1);
  });

  it('falls back to tv when movie not found', async () => {
    contentRepo.findOne.mockResolvedValueOnce(null);
    const notFound = Object.assign(new Error('not found'), {
      response: { status: 404 },
    });
    contentService.addFromTmdb
      .mockRejectedValueOnce(notFound)
      .mockResolvedValueOnce({ id: 3 } as Content);
    ratingRepo.findOne.mockResolvedValueOnce(null);
    ratingRepo.create.mockReturnValue({} as Rating);
    ratingRepo.save.mockResolvedValue({} as Rating);

    await service.rateContent(user, '20', 7);

    expect(contentService.addFromTmdb).toHaveBeenNthCalledWith(1, '20', 'movie');
    expect(contentService.addFromTmdb).toHaveBeenNthCalledWith(2, '20', 'tv');
  });
});