import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { MasterRealmSeeder } from '../../src/database/seeders/meta-data/master-realm.seeder';
import { PermissionsSeeder } from '../../src/database/seeders/meta-data/permissions.seeder';
import { SettingDefinitionsSeeder } from '../../src/database/seeders/meta-data/setting-definitions.seeder';
import { AttributeDefinitionsSeeder } from '../../src/database/seeders/meta-data/attribute-definitions.seeder';

/**
 * Boots the real AppModule against the test database (see test/load-env.ts) and
 * mirrors the global config from src/main.ts, so e2e tests exercise the same
 * ValidationPipe / serializer / global guards as production.
 *
 * The test DB uses DB_SYNCHRONIZE=true (from .env.test), so TypeORM creates the
 * schema on init — no migrations needed for tests.
 */
export async function createTestApp(): Promise<{
  app: INestApplication;
  dataSource: DataSource;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  // Keep these in sync with src/main.ts.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  await app.init();

  const dataSource = app.get(DataSource);
  return { app, dataSource };
}

/**
 * Seeds the base fixtures by reusing the SAME seeder classes as `yarn seed`
 * (single source of truth), just invoked programmatically. Order matters:
 * MasterRealmSeeder creates the master realm + roles + super admin; the rest
 * depend on it.
 */
export async function seedDatabase(dataSource: DataSource): Promise<void> {
  await new MasterRealmSeeder().run(dataSource);
  await new PermissionsSeeder().run(dataSource);
  await new SettingDefinitionsSeeder().run(dataSource);
  await new AttributeDefinitionsSeeder().run(dataSource);
}

/**
 * Marks every user's email as verified. Login requires a verified email; seeded
 * and API-created users start unverified, so tests flip this directly rather
 * than driving the whole email-verification flow (out of scope for authz tests).
 */
export async function verifyAllUsersEmail(dataSource: DataSource): Promise<void> {
  await dataSource.query('UPDATE users SET is_email_verified = true');
}

/**
 * Truncates every table so each suite starts from a clean slate. Disables FK
 * checks around the truncation (MySQL) since tables reference each other.
 */
export async function resetDatabase(dataSource: DataSource): Promise<void> {
  const tables = dataSource.entityMetadatas.map((m) => m.tableName);
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of tables) {
    await dataSource.query(`TRUNCATE TABLE \`${table}\``);
  }
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}

/**
 * Logs in via the real HTTP endpoint and returns the access token.
 * Defaults to the seeded master-realm super admin.
 */
export async function login(
  app: INestApplication,
  {
    realmName = process.env.MASTER_REALM_NAME || 'master',
    username = process.env.SUPER_ADMIN_USERNAME || 'superadmin',
    password = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe!SuperAdmin123',
  }: { realmName?: string; username?: string; password?: string } = {},
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post(`/auth/${realmName}/login`)
    .send({ username, password })
    .expect(200);
  return res.body.token as string;
}
