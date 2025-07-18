import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';

import { databaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContentModule } from './content/content.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { RatingModule } from './ratings/ratings.module';
import { MoviesModule } from './movies/movies.module';

import * as dotenv from 'dotenv';
import { join } from 'path';

// dotenv laden, bevor Nest initialisiert wird
dotenv.config({ path: join(__dirname, '..', '.env') });
console.log('📂 .env geladen aus:', join(__dirname, '..', '.env'));
console.log('📍 NODE_ENV:', process.env.NODE_ENV);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
    }),
    ScheduleModule.forRoot(),
    HttpModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ContentModule,
    WatchlistModule,
    RatingModule,
    MoviesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
