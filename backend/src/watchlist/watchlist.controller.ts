import { Controller, Post, Body, Get, Delete, UseGuards, Request, Param, BadRequestException } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('watchlist')
export class WatchlistController {
  constructor(private watchlistService: WatchlistService) {}

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addToWatchlist(
    @Request() req,
    @Body() body: { tmdbId: string; type?: 'movie' | 'tv' },
  ) {
    if (!body.tmdbId) {
      throw new BadRequestException('tmdbId is required');
    }
    try {
      return await this.watchlistService.addToWatchlist(
        req.user,
        body.tmdbId,
        body.type,
      );
    } catch (error) {
      throw new BadRequestException(`Failed to add to watchlist: ${error.message}`);
    }
  }
  @UseGuards(JwtAuthGuard)
@Post('rate')
async setRating(@Request() req, @Body() body: { tmdbId: string; rating: number }) {
  if (!body.tmdbId || body.rating == null) {
    throw new BadRequestException('tmdbId and rating are required');
  }
  try {
    await this.watchlistService.setRating(req.user.id, body.tmdbId, body.rating);
    return { message: 'Rating set successfully' };
  } catch (error) {
    throw new BadRequestException(`Failed to set rating: ${error.message}`);
  }
}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getWatchlist(@Request() req) {
    return this.watchlistService.getWatchlist(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  async getUserWatchlist(@Request() req) {
    return this.watchlistService.getUserWatchlist(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('user/:tmdbId')
  async removeFromWatchlist(@Request() req, @Param('tmdbId') tmdbId: string) {
    try {
      await this.watchlistService.removeFromWatchlist(req.user.id, tmdbId);
      return { message: 'Content removed from watchlist' };
    } catch (error) {
      throw new BadRequestException(`Failed to remove from watchlist: ${error.message}`);
    }
  }
}