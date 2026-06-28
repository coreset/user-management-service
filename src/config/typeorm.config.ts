import { config as dotenvConfig } from 'dotenv';
import { DataSourceOptions } from 'typeorm';

/**
 * Standalone TypeORM DataSource options for the SEED SCRIPT only.
 *
 * Used by: src/database/seeders/seed.ts (run via `yarn seed`).
 *
 * Why separate from the running app: the app configures its DB inside
 * AppModule's TypeOrmModule.forRootAsync(...) using Nest's ConfigService.
 * The seeder runs as a plain ts-node script OUTSIDE Nest, so it has no DI /
 * ConfigModule — it must load `.env` itself (dotenvConfig) and hand raw options
 * to `new DataSource(...)`. Same database, two configs by necessity.
 *
 * About `synchronize`:
 * When `synchronize` is true, TypeORM looks at your entity classes and
 * automatically changes the database tables to match them on startup
 * (creating/altering columns). This is handy while developing, but risky in
 * production because it can change or drop real data without warning.
 *
 * - In development (NODE_ENV is not 'production'): it is true, so tables are
 *   kept in sync automatically.
 * - In production (NODE_ENV is 'production'): it is false, so the database is
 *   never auto-changed. There you should update the schema with migrations
 *   (controlled, reviewed SQL) instead.
 *
 * Also: the seed script turns `synchronize` off no matter what, so running
 * `yarn seed` only inserts data and never changes the table structure.
 */
dotenvConfig(); // load .env before reading config

export default {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT!,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
} as DataSourceOptions;
