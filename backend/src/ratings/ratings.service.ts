import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './entities/ratings.entity';
import { User } from '../users/entities/user.entity';
import { Content } from '../content/entities/content.entity';
import { ContentService } from '../content/content.service';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private ratingRepo: Repository<Rating>,

    @InjectRepository(Content)
    private contentRepo: Repository<Content>,

    private contentService: ContentService,
  ) {}

  /**
   * Rate a content by its TMDb ID, creating the content record if missing
   */
  async rateContent(
    user: User,
    tmdbId: string,
    score: number,
  ): Promise<Rating> {
    if (score < 0 || score > 10) {
      throw new BadRequestException('Score must be between 0.0 and 10.0');
    }

    // 1) Find or create Content by TMDb ID
    let content = await this.contentRepo.findOne({ where: { tmdbId } });
    if (!content) {
      try {
        content = await this.contentService.addFromTmdb(tmdbId, 'movie');
      } catch (err: any) {
        if (err?.response?.status === 404) {
          content = await this.contentService.addFromTmdb(tmdbId, 'tv');
        } else {
          throw err;
        }
      }
    }

    // 2) Find existing rating
    let rating = await this.ratingRepo.findOne({
      where: { user: { id: user.id }, content: { id: content.id } },
    });
    if (rating) {
      rating.score = score;
      rating.ratedAt = new Date();
    } else {
      rating = this.ratingRepo.create({ user, content, score });
    }

    // 3) Save and return
    return this.ratingRepo.save(rating);
  }

  /**
   * Retrieve all ratings for a given user
   */
  async getUserRatings(userId: number): Promise<Rating[]> {
    return this.ratingRepo.find({
      where: { user: { id: userId } },
      relations: ['content'],
    });
  }
}
