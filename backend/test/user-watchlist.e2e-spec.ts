import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Repository } from 'typeorm';

import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { WatchlistModule } from '../src/watchlist/watchlist.module';
import { ContentModule } from '../src/content/content.module';
import { ContentService } from '../src/content/content.service';
import { User } from '../src/users/entities/user.entity';
import { Content } from '../src/content/entities/content.entity';
import { Watchlist } from '../src/watchlist/entities/watchlist.entity';
import { CastMember } from '../src/cast-member/cast-member.entity';

describe('User Auth and Watchlist (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [User, Content, Watchlist, CastMember],
          synchronize: true,
        }),
        AuthModule,
        UsersModule,
        ContentModule,
        WatchlistModule,
      ],
    })
      .overrideProvider(ContentService)
      .useFactory({
        factory: (contentRepo: Repository<Content>) => ({
          addFromTmdb: async (tmdbId: string, type: 'movie' | 'tv') => {
            const content = contentRepo.create({
              tmdbId,
              type,
              title: `Mock ${tmdbId}`,
            });
            return contentRepo.save(content);
          },
        }),
        inject: [getRepositoryToken(Content)],
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'testuser', email: 'test@example.com', password: 'pass' })
      .expect(201);

    expect(res.body.access_token).toBeDefined();
  });

  it('logs in a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'pass' })
      .expect(201);

    expect(res.body.access_token).toBeDefined();
    accessToken = res.body.access_token;
  });

  it('adds content to watchlist and retrieves it', async () => {
    await request(app.getHttpServer())
      .post('/watchlist/add')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tmdbId: '1', type: 'movie' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/watchlist')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].content.tmdbId).toBe('1');
  });
});