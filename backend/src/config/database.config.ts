import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres', // Angepasst an docker-compose.yml
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME || 'streamfinder',
  password: process.env.DB_PASSWORD || 'securepass',
  database: process.env.DB_DATABASE || 'streamfinder',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  // Schema synchronization is disabled by default for safety.
  // Set TYPEORM_SYNC="true" to enable during development.
  synchronize: process.env.TYPEORM_SYNC === 'true',
};