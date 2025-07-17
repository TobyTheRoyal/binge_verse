import { Module } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { WatchlistController } from './watchlist.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Watchlist } from './entities/watchlist.entity';
import { Content } from '../content/entities/content.entity';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Watchlist, Content]),
    ContentModule, // Importiert ContentModule, um ContentService bereitzustellen
  ],
  providers: [WatchlistService],
  controllers: [WatchlistController],
})
export class WatchlistModule {}