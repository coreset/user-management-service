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
const TENANT = 'tenant-a';
const TENANT_USER = { username: 'tenantuser', password: 'Passw0rd', email: 'tenantuser@example.com' };

/**
 * Exercises the PermissionsGuard's realm handling end-to-end:
 *   - a master-realm SUPER_ADMIN is a global admin (bypasses into any realm),
 *   - a tenant user is confined to their own realm (blocked from master).
 *
 * Setup uses the real API: the super admin creates a second realm + a user in it.
 */
describe('Tenant isolation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let superAdminToken: string;
  let tenantToken: string;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
    await resetDatabase(dataSource);
    await seedDatabase(dataSource);
    await verifyAllUsersEmail(dataSource);

    superAdminToken = await login(app);

    // Master super admin creates a second realm (bypass allows realm creation).
    await request(app.getHttpServer())
      .post('/realms')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ realmName: TENANT, displayName: 'Tenant A' })
      .expect(201);

    // ...and a user inside that realm (cross-realm bypass allows this too).
    await request(app.getHttpServer())
      .post(`/users/${TENANT}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        username: TENANT_USER.username,
        firstName: 'Tenant',
        lastName: 'User',
        email: TENANT_USER.email,
        password: TENANT_USER.password,
      })
      .expect(201);

    // The API-created tenant user starts unverified; verify so it can log in.
    await verifyAllUsersEmail(dataSource);

    tenantToken = await login(app, {
      realmName: TENANT,
      username: TENANT_USER.username,
      password: TENANT_USER.password,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets the master super admin act across realms (cross-realm bypass)', async () => {
    await request(app.getHttpServer())
      .get(`/realms/${TENANT}/roles`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);
  });

  it('blocks a tenant user from another realm (master) — tenant isolation', async () => {
    await request(app.getHttpServer())
      .get(`/realms/${MASTER}/roles`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(403);
  });

  it('denies a tenant user on their own realm route when lacking the permission (403, not a crash)', async () => {
    // The freshly-created tenant user has no roles/permissions yet: same-realm,
    // so isolation does not fire — it falls through to the permission check.
    await request(app.getHttpServer())
      .get(`/realms/${TENANT}/roles`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(403);
  });
});
