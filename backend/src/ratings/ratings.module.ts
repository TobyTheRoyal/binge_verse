import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './entities/ratings.entity';
import { Content } from '../content/entities/content.entity';
import { RatingService } from './ratings.service';
import { RatingController } from './ratings.controller';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [
    // Register both Rating and Content repositories
    TypeOrmModule.forFeature([Rating, Content]),
    // Import ContentModule to get ContentService provider
    ContentModule,
  ],
  providers: [RatingService],
  controllers: [RatingController],
  exports: [RatingService],
})
export class RatingModule {}
