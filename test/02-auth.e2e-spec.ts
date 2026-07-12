import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import {
  createTestApp,
  seedDatabase,
  resetDatabase,
  verifyAllUsersEmail,
  login,
} from './utils/test-app';

const MASTER = process.env.MASTER_REALM_NAME || 'master';
const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
const SUPER_ADMIN_PASSWORD =
  process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe!SuperAdmin123';

describe('Auth & Authorization (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
    await resetDatabase(dataSource);
    await seedDatabase(dataSource);
    await verifyAllUsersEmail(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/:realmName/login', () => {
    it('logs in the seeded super admin and returns a token', async () => {
      const res = await request(app.getHttpServer())
        .post(`/auth/${MASTER}/login`)
        .send({ username: SUPER_ADMIN_USERNAME, password: SUPER_ADMIN_PASSWORD })
        .expect(200);

      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.id).toEqual(expect.any(String));
    });

    it('rejects a wrong password with 401', async () => {
      await request(app.getHttpServer())
        .post(`/auth/${MASTER}/login`)
        .send({ username: SUPER_ADMIN_USERNAME, password: 'wrong-password-1' })
        .expect(401);
    });

    it('returns 404 for an unknown realm', async () => {
      await request(app.getHttpServer())
        .post(`/auth/does-not-exist/login`)
        .send({ username: SUPER_ADMIN_USERNAME, password: SUPER_ADMIN_PASSWORD })
        .expect(404);
    });
  });

  describe('PermissionsGuard on a guarded route', () => {
    const guardedRoute = `/realms/${MASTER}/roles`; // requires ROLES_READ

    it('blocks an unauthenticated request (401)', async () => {
      await request(app.getHttpServer()).get(guardedRoute).expect(401);
    });

    it('allows the master super admin (bypass) with 200', async () => {
      const token = await login(app);
      await request(app.getHttpServer())
        .get(guardedRoute)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
