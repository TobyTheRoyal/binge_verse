import { Controller, Post, Body, Get, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RatingService } from './ratings.service';

@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async rateContent(
    @Request() req,
    @Body() body: { tmdbId: string; score: number },
  ) {
    const { tmdbId, score } = body;
    if (!tmdbId || score == null) {
      throw new BadRequestException('tmdbId and score are required');
    }
    // Leitet weiter an RatingService, der Content bei Bedarf selbst anlegt
    return this.ratingService.rateContent(req.user, tmdbId, score);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserRatings(@Request() req) {
    return this.ratingService.getUserRatings(req.user.id);
  }
}