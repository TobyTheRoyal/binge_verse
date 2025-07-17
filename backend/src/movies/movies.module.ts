import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from '../content/entities/content.entity';
import { ContentService } from '../content/content.service';
import { MoviesController } from './movies.controller';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [
    TypeOrmModule.forFeature([Content]),
    HttpModule
  ],
  providers: [ContentService],
  controllers: [MoviesController],
})
export class MoviesModule {}