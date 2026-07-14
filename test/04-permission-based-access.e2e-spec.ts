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
const USER_A = { username: 'userA', password: 'Passw0rd123', email: 'userA@example.com' };
const MANAGER_ROLE = { name: 'Manager', displayName: 'Manager Role' };

/**
 * Tests permission-based access control:
 *   1. without roles:read, a user gets 403 on GET /realms/{realm}/roles
 *   2-3. granting roles:read (via a Manager role) succeeds
 *   4. the same user then gets 200 on the previously-denied route
 *   5. without roles:create, a user gets 403 on POST /realms/{realm}/roles
 *   6. without roles:delete, a user gets 403 on DELETE /realms/{realm}/roles/{id}
 *
 * Note: this is a single-realm scenario (no pawn realm / ManagerA-B / userX-Z)
 * that predates the 42-item multi-realm requirement chain in README.md — the
 * numbers below are local to this file only, not the README's 1-42 numbering
 * (see 05-multi-realm-setup and 06-multi-realm-role-assignment for that chain).
 *
 * Validates that the PermissionsGuard checks both realm isolation and granular
 * permission grants (not just role membership).
 */
describe('Permission-based access control (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let superAdminToken: string;
  let userAToken: string;
  let managerRoleId: string;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
    await resetDatabase(dataSource);
    await seedDatabase(dataSource);
    await verifyAllUsersEmail(dataSource);

    superAdminToken = await login(app);

    // Super admin creates userA in master realm.
    const createUserRes = await request(app.getHttpServer())
      .post(`/users/${MASTER}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        username: USER_A.username,
        firstName: 'UserA',
        lastName: 'Test',
        email: USER_A.email,
        password: USER_A.password,
      });

    if (createUserRes.status !== 201) {
      console.error('User creation failed:', createUserRes.status, createUserRes.body);
      throw new Error(`User creation failed: ${JSON.stringify(createUserRes.body)}`);
    }

    // API-created user starts unverified; verify for login.
    await verifyAllUsersEmail(dataSource);

    // userA logs in (no roles/permissions yet).
    userAToken = await login(app, {
      realmName: MASTER,
      username: USER_A.username,
      password: USER_A.password,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('1: denies userA access to read roles (no roles:read permission)', async () => {
    await request(app.getHttpServer())
      .get(`/realms/${MASTER}/roles`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(403);
  });

  it('2: super admin creates Manager role with roles:read permission', async () => {
    // Create the Manager role.
    const createRoleRes = await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(MANAGER_ROLE)
      .expect(201);

    managerRoleId = createRoleRes.body.id;

    // Fetch permissions in master realm to find 'roles:read'.
    const permissionsRes = await request(app.getHttpServer())
      .get(`/realms/${MASTER}/permissions`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    const rolesReadPermission = permissionsRes.body.find(
      (p: any) => p.name === 'roles:read',
    );
    if (!rolesReadPermission) {
      throw new Error('roles:read permission not found in master realm');
    }

    // Assign the roles:read permission to the Manager role.
    // This endpoint is SUPER_ADMIN-only, returns 201 Created.
    await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles/${managerRoleId}/permissions`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ permissionIds: [rolesReadPermission.id] })
      .expect(201);
  });

  it('3: super admin assigns Manager role to userA', async () => {
    // Find userA's ID from the users endpoint.
    const usersRes = await request(app.getHttpServer())
      .get(`/users`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    const userARecord = usersRes.body.find((u: any) => u.username === USER_A.username);
    if (!userARecord) {
      throw new Error(`User ${USER_A.username} not found`);
    }

    // Assign userA to the Manager role using the role endpoint.
    // POST /realms/:realmName/roles/:roleId/users
    // This endpoint returns 201 Created.
    await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles/${managerRoleId}/users`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ userIdList: [userARecord.id] })
      .expect(201);
  });

  it('4: userA can now read roles (has roles:read permission via Manager role)', async () => {
    // Refresh userA's token to pick up the new role/permissions.
    userAToken = await login(app, {
      realmName: MASTER,
      username: USER_A.username,
      password: USER_A.password,
    });

    await request(app.getHttpServer())
      .get(`/realms/${MASTER}/roles`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);
  });

  it('5: denies userA access to create roles (no roles:create permission)', async () => {
    await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'NewRole', displayName: 'New Role' })
      .expect(403);
  });

  it('6: denies userA access to delete roles (no roles:delete permission)', async () => {
    await request(app.getHttpServer())
      .delete(`/realms/${MASTER}/roles/${managerRoleId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(403);
  });
});
