import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Watchlist } from './entities/watchlist.entity';
import { Content } from '../content/entities/content.entity';
import { User } from '../users/entities/user.entity';
import { ContentService } from '../content/content.service';

@Injectable()
export class WatchlistService {
  private readonly logger = new Logger(WatchlistService.name);
  constructor(
    @InjectRepository(Watchlist)
    private watchlistRepository: Repository<Watchlist>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    private contentService: ContentService,
  ) {}

  async addToWatchlist(
    user: User,
    tmdbId: string,
    type?: 'movie' | 'tv',
  ): Promise<Watchlist> {
    try {
      let content = await this.contentRepository.findOne({ where: { tmdbId } });
      if (!content) {
        if (type) {
          content = await this.contentService.addFromTmdb(tmdbId, type);
        } else {
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
      }
      const watchlistEntry = this.watchlistRepository.create({
        user,
        content,
      });
      return await this.watchlistRepository.save(watchlistEntry);
    } catch (error) {
      if (error instanceof NotFoundException || error?.response?.status === 404) {
        throw new NotFoundException(`Content ${tmdbId} not found`);
      }
      this.logger.error(
        `Unexpected error adding ${tmdbId} to watchlist: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to add content to watchlist');
    }
  }

  async getWatchlist(userId: number): Promise<Watchlist[]> {
    return this.watchlistRepository.find({
      where: { user: { id: userId } },
      relations: ['content'],
    });
  }

  async getUserWatchlist(userId: number): Promise<Content[]> {
    const watchlist = await this.getWatchlist(userId);
    return watchlist.map((entry) => entry.content);
  }

  async setRating(userId: number, tmdbId: string, rating: number): Promise<void> {
    const content = await this.contentRepository.findOne({ where: { tmdbId } });
    if (!content) {
      throw new NotFoundException('Content not found');
    }
    const watchlistEntry = await this.watchlistRepository.findOne({
      where: { user: { id: userId }, content: { id: content.id } },
    });
    if (!watchlistEntry) {
      throw new NotFoundException('Content not in watchlist');
    }
    watchlistEntry.rating = rating;
    await this.watchlistRepository.save(watchlistEntry);
  }

  async removeFromWatchlist(userId: number, tmdbId: string): Promise<void> {
    const content = await this.contentRepository.findOne({ where: { tmdbId } });
    if (!content) {
      throw new NotFoundException('Content not found');
    }
    await this.watchlistRepository.delete({
      user: { id: userId },
      content: { id: content.id },
    });
  }
}