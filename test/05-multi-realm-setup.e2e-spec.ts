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
const PAWN = 'pawn';
const USER_A = { username: 'userA', password: 'Passw0rd123', email: 'userA@example.com', firstName: 'User', lastName: 'Alpha' };
const USER_B = { username: 'userB', password: 'Passw0rd456', email: 'userB@example.com', firstName: 'User', lastName: 'Beta' };
const MANAGER_A_ROLE = { name: 'ManagerA', displayName: 'Manager A Role' };
const MANAGER_B_ROLE = { name: 'ManagerB', displayName: 'Manager B Role' };
const ROLE_PERMISSION_NAMES = ['roles:read', 'roles:create', 'roles:delete', 'roles:update'];

/** Fetches a realm's permission catalog and resolves the ids for the given names. */
async function fetchPermissionIds(
  app: INestApplication,
  token: string,
  realmName: string,
  names: string[],
): Promise<string[]> {
  const res = await request(app.getHttpServer())
    .get(`/realms/${realmName}/permissions`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  return names
    .map((name) => res.body.find((p: any) => p.name === name))
    .filter(Boolean)
    .map((p: any) => p.id);
}

/**
 * Phase 1: Multi-realm setup, permission assignment, role assignment, and
 * read-access isolation — covers the requirement chain steps 1-23:
 *   1-5.   Create pawn realm, userA (master), userB (pawn), ManagerA (master), ManagerB (pawn)
 *   6-7.   Grant master roles:* permissions to ManagerA (success) / ManagerB (cross-realm denied)
 *   8-11.  Login isolation: userA->master (success), userB->master (denied),
 *          userA->pawn (denied), userB->pawn (success)
 *   12-13. Read roles BEFORE role assignment -> denied (no role means no permissions yet)
 *   14-17. Assign ManagerA/ManagerB to userA/userB, cross-realm assignment denied
 *   18-21. Read roles AFTER role assignment -> success/denied per tenant isolation
 *   22-23. Read permissions endpoint without permissions:read -> denied
 *
 * Note: requirement 19 ("userB read pawn realm roles -> success") is only
 * reachable once ManagerB actually holds a PAWN-realm roles:read permission.
 * Step 7 explicitly denies attaching MASTER permissions to ManagerB (cross-realm
 * block), so an additional grant of PAWN's own roles:* permissions to ManagerB is
 * required to satisfy 19 — added below as its own labeled step.
 */
describe('Multi-realm setup, permissions, and role assignment isolation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let superAdminToken: string;
  let userAToken: string;
  let userBToken: string;
  let managerARoleId: string;
  let managerBRoleId: string;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
    await resetDatabase(dataSource);
    await seedDatabase(dataSource);
    await verifyAllUsersEmail(dataSource);

    superAdminToken = await login(app);

    // --- Requirement 1: create pawn realm ---
    await request(app.getHttpServer())
      .post('/realms')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ realmName: PAWN, displayName: 'Pawn Realm' })
      .expect(201);

    // --- Requirement 2: create userA under master realm ---
    await request(app.getHttpServer())
      .post(`/users/${MASTER}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        username: USER_A.username,
        firstName: USER_A.firstName,
        lastName: USER_A.lastName,
        email: USER_A.email,
        password: USER_A.password,
      })
      .expect(201);

    // --- Requirement 3: create userB under pawn realm ---
    await request(app.getHttpServer())
      .post(`/users/${PAWN}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        username: USER_B.username,
        firstName: USER_B.firstName,
        lastName: USER_B.lastName,
        email: USER_B.email,
        password: USER_B.password,
      })
      .expect(201);

    await verifyAllUsersEmail(dataSource);

    // --- Requirement 4: create ManagerA role under master realm ---
    const managerARes = await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(MANAGER_A_ROLE)
      .expect(201);
    managerARoleId = managerARes.body.id;

    // --- Requirement 5: create ManagerB role under pawn realm ---
    const managerBRes = await request(app.getHttpServer())
      .post(`/realms/${PAWN}/roles`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(MANAGER_B_ROLE)
      .expect(201);
    managerBRoleId = managerBRes.body.id;

    // Resolve user ids for later role-assignment steps.
    const usersRes = await request(app.getHttpServer())
      .get(`/users`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);
    userAId = usersRes.body.find((u: any) => u.username === USER_A.username).id;
    userBId = usersRes.body.find((u: any) => u.username === USER_B.username).id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ========== Requirements 6-7: Permission assignment (master perms) ==========

  it('06: super admin adds roles:read/create/delete/update (master) to ManagerA — success', async () => {
    const permissionIds = await fetchPermissionIds(app, superAdminToken, MASTER, ROLE_PERMISSION_NAMES);
    if (permissionIds.length !== ROLE_PERMISSION_NAMES.length) {
      throw new Error('Not all role permissions found in master realm');
    }

    await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles/${managerARoleId}/permissions`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ permissionIds })
      .expect(201);
  });

  it('07: super admin adds roles:read/create/delete/update (master) to ManagerB (pawn role) — access denied', async () => {
    const permissionIds = await fetchPermissionIds(app, superAdminToken, MASTER, ROLE_PERMISSION_NAMES);

    // Assigning MASTER-realm permission ids to a PAWN-realm role: the service
    // looks the ids up scoped to role.realm.id, so none of them resolve -> 400.
    const res = await request(app.getHttpServer())
      .post(`/realms/${PAWN}/roles/${managerBRoleId}/permissions`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ permissionIds });

    expect([400, 403, 404]).toContain(res.status);
  });

  it("07a (inferred): super admin bootstraps pawn realm's own permission catalog — success", async () => {
    // Permissions are realm-scoped (UNIQUE(realm_id, name)) and only MASTER gets
    // bootstrapped by PermissionsSeeder. A realm created through the API (like
    // pawn here) starts with NO permission rows at all, so roles:read etc must be
    // explicitly created here before they can be assigned to ManagerB below.
    for (const name of ROLE_PERMISSION_NAMES) {
      await request(app.getHttpServer())
        .post(`/realms/${PAWN}/permissions`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name })
        .expect(201);
    }
  });

  it("07b (inferred): super admin adds pawn's own roles:read/create/delete/update to ManagerB — success", async () => {
    // Not explicitly listed in the requirement chain, but required for requirement
    // 19 ("userB read pawn realm roles -> success") and 26 ("userB create role in
    // pawn -> success") to be reachable at all: ManagerB needs its OWN realm's
    // roles:* permissions, since step 07 correctly blocks the master ones.
    const permissionIds = await fetchPermissionIds(app, superAdminToken, PAWN, ROLE_PERMISSION_NAMES);
    if (permissionIds.length !== ROLE_PERMISSION_NAMES.length) {
      throw new Error('Not all role permissions found in pawn realm');
    }

    await request(app.getHttpServer())
      .post(`/realms/${PAWN}/roles/${managerBRoleId}/permissions`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ permissionIds })
      .expect(201);
  });

  // ========== Requirements 8-11: Login isolation ==========

  it('08: userA logs in to master realm — success', async () => {
    userAToken = await login(app, {
      realmName: MASTER,
      username: USER_A.username,
      password: USER_A.password,
    });
    expect(typeof userAToken).toBe('string');
    expect(userAToken.length).toBeGreaterThan(0);
  });

  it('09: userB tries to login to master realm — access denied', async () => {
    const res = await request(app.getHttpServer())
      .post(`/auth/${MASTER}/login`)
      .send({ username: USER_B.username, password: USER_B.password });

    expect([401, 404]).toContain(res.status);
  });

  it('10: userA tries to login to pawn realm — access denied', async () => {
    const res = await request(app.getHttpServer())
      .post(`/auth/${PAWN}/login`)
      .send({ username: USER_A.username, password: USER_A.password });

    expect([401, 404]).toContain(res.status);
  });

  it('11: userB logs in to pawn realm — success', async () => {
    userBToken = await login(app, {
      realmName: PAWN,
      username: USER_B.username,
      password: USER_B.password,
    });
    expect(typeof userBToken).toBe('string');
    expect(userBToken.length).toBeGreaterThan(0);
  });

  // ========== Requirements 12-13: Read roles BEFORE role assignment ==========

  it('12: userA reads master realm roles (no role assigned yet) — access denied', async () => {
    const res = await request(app.getHttpServer())
      .get(`/realms/${MASTER}/roles`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(403);
  });

  it('13: userB reads pawn realm roles (no role assigned yet) — access denied', async () => {
    const res = await request(app.getHttpServer())
      .get(`/realms/${PAWN}/roles`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(403);
  });

  // ========== Requirements 14-17: Role assignment, cross-realm denied ==========

  it('14: super admin assigns ManagerA role to userA — success', async () => {
    await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles/${managerARoleId}/users`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ userIdList: [userAId] })
      .expect(201);
  });

  it('15: super admin assigns ManagerB role to userA — access denied (cross-realm)', async () => {
    // ManagerB lives in pawn; userA lives in master. usersService.findByIdList is
    // scoped to role.realm.id, so userA won't resolve there -> 400.
    const res = await request(app.getHttpServer())
      .post(`/realms/${PAWN}/roles/${managerBRoleId}/users`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ userIdList: [userAId] });

    expect([400, 403, 404]).toContain(res.status);
  });

  it('16: super admin assigns ManagerB role to userB — success', async () => {
    await request(app.getHttpServer())
      .post(`/realms/${PAWN}/roles/${managerBRoleId}/users`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ userIdList: [userBId] })
      .expect(201);
  });

  it('17: super admin assigns ManagerA role to userB — access denied (cross-realm)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles/${managerARoleId}/users`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ userIdList: [userBId] });

    expect([400, 403, 404]).toContain(res.status);
  });

  // ========== Requirements 18-21: Read roles AFTER role assignment ==========

  it('18: userA reads master realm roles (now has ManagerA) — success', async () => {
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

  it('19: userB reads pawn realm roles (now has ManagerB + pawn perms) — success', async () => {
    userBToken = await login(app, {
      realmName: PAWN,
      username: USER_B.username,
      password: USER_B.password,
    });

    await request(app.getHttpServer())
      .get(`/realms/${PAWN}/roles`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(200);
  });

  it('20: userA tries to read pawn realm roles — access denied (tenant isolation)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/realms/${PAWN}/roles`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(403);
  });

  it('21: userB tries to read master realm roles — access denied (tenant isolation)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/realms/${MASTER}/roles`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(403);
  });

  // ========== Requirements 22-23: Read permissions endpoint — denied ==========

  it('22: userA tries to read master realm permissions — access denied', async () => {
    const res = await request(app.getHttpServer())
      .get(`/realms/${MASTER}/permissions`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(403);
  });

  it('23: userB tries to read pawn realm permissions — access denied', async () => {
    const res = await request(app.getHttpServer())
      .get(`/realms/${PAWN}/permissions`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(403);
  });
});
