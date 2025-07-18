import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const databaseConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  const url = configService.get<string>('DATABASE_URL');
  if (!url) throw new Error('DATABASE_URL fehlt in der .env!');

  console.log('🔌 Connect-URL:', url);
  console.log('🔌 PGSSLMODE=', process.env.PGSSLMODE);

  return {
    type: 'postgres',
    url,
    ssl: {
      rejectUnauthorized: false,
    },
    extra: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
    synchronize: configService.get<string>('TYPEORM_SYNC') === 'true',
    autoLoadEntities: true,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  };
};
