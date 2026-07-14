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
const USER_X = { username: 'userX', password: 'Passw0rdX99', email: 'userX@example.com', firstName: 'User', lastName: 'Xray' };
const USER_Y = { username: 'userY', password: 'Passw0rdY99', email: 'userY@example.com', firstName: 'User', lastName: 'Yankee' };
const USER_Z = { username: 'userZ', password: 'Passw0rdZ99', email: 'userZ@example.com', firstName: 'User', lastName: 'Zulu' };
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

/** Bootstraps a realm's permission catalog (realms other than master start empty). */
async function bootstrapPermissions(
  app: INestApplication,
  token: string,
  realmName: string,
  names: string[],
): Promise<void> {
  for (const name of names) {
    await request(app.getHttpServer())
      .post(`/realms/${realmName}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name })
      .expect(201);
  }
}

async function getUserId(app: INestApplication, token: string, username: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .get(`/users`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  const record = res.body.find((u: any) => u.username === username);
  if (!record) throw new Error(`User ${username} not found`);
  return record.id;
}

/**
 * Phase 2: role/user creation permission checks and the userX/userY assignment
 * chain — covers requirement chain steps 24-42. Replicates the same base state
 * as 05 (steps 1-21: realms, users, ManagerA/B with roles:* assigned and granted)
 * in its own beforeAll, since each e2e file resets its own database.
 *
 *   24-26. Role creation: userA creates in master (success), userB creates in
 *          master (cross-realm denied), userB creates in pawn (success)
 *   27-29. User creation BEFORE users:create is granted -> denied for all three
 *   30-32. Grant users:create (+ roles:assign-users) to ManagerA/ManagerB,
 *          including a cross-realm denial
 *   33-35. User creation AFTER users:create granted -> success/denied
 *   36-38. Role assignment by non-super-admin managers, including cross-realm error
 *   39-42. userX/userY login and read-roles chain
 */
describe('Multi-realm role/user creation and assignment chain (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let superAdminToken: string;
  let userAToken: string;
  let userBToken: string;
  let managerARoleId: string;
  let managerBRoleId: string;
  let userXId: string;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
    await resetDatabase(dataSource);
    await seedDatabase(dataSource);
    await verifyAllUsersEmail(dataSource);

    superAdminToken = await login(app);

    // Replicate 05's end-state (requirements 1-21) as plain setup.
    await request(app.getHttpServer())
      .post('/realms')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ realmName: PAWN, displayName: 'Pawn Realm' })
      .expect(201);

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

    const managerARes = await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(MANAGER_A_ROLE)
      .expect(201);
    managerARoleId = managerARes.body.id;

    const managerBRes = await request(app.getHttpServer())
      .post(`/realms/${PAWN}/roles`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(MANAGER_B_ROLE)
      .expect(201);
    managerBRoleId = managerBRes.body.id;

    // Pawn realm starts with no permission catalog — bootstrap it (see 05/07a).
    // Includes users:create and roles:assign-users up front since later steps
    // (32, 36a) need them present in the catalog before they can be assigned.
    await bootstrapPermissions(app, superAdminToken, PAWN, [
      ...ROLE_PERMISSION_NAMES,
      'users:create',
      'roles:assign-users',
    ]);

    const masterRolePermIds = await fetchPermissionIds(app, superAdminToken, MASTER, ROLE_PERMISSION_NAMES);
    await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles/${managerARoleId}/permissions`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ permissionIds: masterRolePermIds })
      .expect(201);

    const pawnRolePermIds = await fetchPermissionIds(app, superAdminToken, PAWN, ROLE_PERMISSION_NAMES);
    await request(app.getHttpServer())
      .post(`/realms/${PAWN}/roles/${managerBRoleId}/permissions`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ permissionIds: pawnRolePermIds })
      .expect(201);

    const userAId = await getUserId(app, superAdminToken, USER_A.username);
    const userBId = await getUserId(app, superAdminToken, USER_B.username);

    await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles/${managerARoleId}/users`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ userIdList: [userAId] })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/realms/${PAWN}/roles/${managerBRoleId}/users`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ userIdList: [userBId] })
      .expect(201);

    userAToken = await login(app, { realmName: MASTER, username: USER_A.username, password: USER_A.password });
    userBToken = await login(app, { realmName: PAWN, username: USER_B.username, password: USER_B.password });
  });

  afterAll(async () => {
    await app.close();
  });

  // ========== Requirements 24-26: Role creation ==========

  it('24: userA creates new role "pawn:create" under master realm — success', async () => {
    await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'pawn:create', displayName: 'pawn:create' })
      .expect(201);
  });

  it('25: userB tries to create role "pawn:read" under master realm — access denied (cross-realm)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'pawn:read', displayName: 'pawn:read' });

    expect(res.status).toBe(403);
  });

  it('26: userB creates role "pawn:read" under pawn realm — success', async () => {
    await request(app.getHttpServer())
      .post(`/realms/${PAWN}/roles`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'pawn:read', displayName: 'pawn:read' })
      .expect(201);
  });

  // ========== Requirements 27-29: User creation BEFORE users:create granted ==========

  it('27: userA tries to create userX under master realm (no users:create yet) — access denied', async () => {
    const res = await request(app.getHttpServer())
      .post(`/users/${MASTER}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        username: USER_X.username,
        firstName: USER_X.firstName,
        lastName: USER_X.lastName,
        email: USER_X.email,
        password: USER_X.password,
      });

    expect(res.status).toBe(403);
  });

  it('28: userB tries to create userY under master realm — access denied (cross-realm)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/users/${MASTER}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        username: USER_Y.username,
        firstName: USER_Y.firstName,
        lastName: USER_Y.lastName,
        email: USER_Y.email,
        password: USER_Y.password,
      });

    expect(res.status).toBe(403);
  });

  it('29: userB tries to create userZ under pawn realm (no users:create yet) — access denied', async () => {
    const res = await request(app.getHttpServer())
      .post(`/users/${PAWN}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        username: USER_Z.username,
        firstName: USER_Z.firstName,
        lastName: USER_Z.lastName,
        email: USER_Z.email,
        password: USER_Z.password,
      });

    expect(res.status).toBe(403);
  });

  // ========== Requirements 30-32: Grant users:create (+ roles:assign-users) ==========

  it('30: super admin assigns master users:create to ManagerA — success', async () => {
    const [usersCreateId] = await fetchPermissionIds(app, superAdminToken, MASTER, ['users:create']);
    await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles/${managerARoleId}/permissions`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ permissionIds: [usersCreateId] })
      .expect(201);
  });

  it('31: super admin assigns master users:create + roles:assign-users to ManagerB — error (cross-realm)', async () => {
    const permissionIds = await fetchPermissionIds(app, superAdminToken, MASTER, ['users:create', 'roles:assign-users']);

    // ManagerB is a PAWN-realm role; master permission ids don't resolve against
    // role.realm.id ('pawn') -> BadRequestException("Permissions not found...").
    const res = await request(app.getHttpServer())
      .post(`/realms/${PAWN}/roles/${managerBRoleId}/permissions`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ permissionIds });

    expect([400, 403, 404]).toContain(res.status);
  });

  it('32: super admin assigns pawn users:create to ManagerB — success', async () => {
    const [usersCreateId] = await fetchPermissionIds(app, superAdminToken, PAWN, ['users:create']);
    await request(app.getHttpServer())
      .post(`/realms/${PAWN}/roles/${managerBRoleId}/permissions`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ permissionIds: [usersCreateId] })
      .expect(201);
  });

  // ========== Requirements 33-35: User creation AFTER users:create granted ==========

  it('33: userA creates userX under master realm — success', async () => {
    userAToken = await login(app, { realmName: MASTER, username: USER_A.username, password: USER_A.password });

    const res = await request(app.getHttpServer())
      .post(`/users/${MASTER}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        username: USER_X.username,
        firstName: USER_X.firstName,
        lastName: USER_X.lastName,
        email: USER_X.email,
        password: USER_X.password,
      })
      .expect(201);

    userXId = res.body.id;
    await verifyAllUsersEmail(dataSource);
  });

  it('34: userB tries to create userY under master realm — access denied (cross-realm)', async () => {
    // userB holds users:create in PAWN (granted at step 32), but that permission
    // doesn't travel across realms: master is a different realm from userB's own,
    // so tenant isolation blocks this regardless of what userB can do in pawn.
    userBToken = await login(app, { realmName: PAWN, username: USER_B.username, password: USER_B.password });

    const res = await request(app.getHttpServer())
      .post(`/users/${MASTER}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        username: USER_Y.username,
        firstName: USER_Y.firstName,
        lastName: USER_Y.lastName,
        email: USER_Y.email,
        password: USER_Y.password,
      });

    expect(res.status).toBe(403);
  });

  it('35: userB creates userY under pawn realm — success', async () => {
    userBToken = await login(app, { realmName: PAWN, username: USER_B.username, password: USER_B.password });

    await request(app.getHttpServer())
      .post(`/users/${PAWN}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        username: USER_Y.username,
        firstName: USER_Y.firstName,
        lastName: USER_Y.lastName,
        email: USER_Y.email,
        password: USER_Y.password,
      })
      .expect(201);

    await verifyAllUsersEmail(dataSource);
  });

  // ========== Requirements 36-38: Role assignment by realm managers ==========

  it("36a (inferred): super admin grants pawn's roles:assign-users to ManagerB — success", async () => {
    // Needed for requirement 36 (userB assigns ManagerB to userY): userB only
    // holds roles:read/create/delete/update + users:create so far, never
    // roles:assign-users, so the assignment below would 403 without this grant.
    const [assignUsersId] = await fetchPermissionIds(app, superAdminToken, PAWN, ['roles:assign-users']);
    await request(app.getHttpServer())
      .post(`/realms/${PAWN}/roles/${managerBRoleId}/permissions`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ permissionIds: [assignUsersId] })
      .expect(201);

    userBToken = await login(app, { realmName: PAWN, username: USER_B.username, password: USER_B.password });
  });

  it('36: userB assigns ManagerB role to userY — success', async () => {
    const userYId = await getUserId(app, superAdminToken, USER_Y.username);
    await request(app.getHttpServer())
      .post(`/realms/${PAWN}/roles/${managerBRoleId}/users`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ userIdList: [userYId] })
      .expect(201);
  });

  it('37: userB tries to assign ManagerB role to userX — error (cross-realm)', async () => {
    // userX lives in master; ManagerB is a pawn-realm role, so userX won't
    // resolve against usersService.findByIdList(role.realm.id) -> 400.
    const res = await request(app.getHttpServer())
      .post(`/realms/${PAWN}/roles/${managerBRoleId}/users`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ userIdList: [userXId] });

    expect([400, 403, 404]).toContain(res.status);
  });

  it('38: userA tries to assign ManagerA role to userX — access denied (no roles:assign-users)', async () => {
    // ManagerA only ever received roles:read/create/delete/update + users:create
    // (steps 06 and 30) — roles:assign-users was never granted to it.
    const res = await request(app.getHttpServer())
      .post(`/realms/${MASTER}/roles/${managerARoleId}/users`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ userIdList: [userXId] });

    expect(res.status).toBe(403);
  });

  // ========== Requirements 39-42: userX/userY login and read-roles chain ==========

  it('39: userX logs in and reads roles under master realm — access denied (no permissions)', async () => {
    const userXToken = await login(app, { realmName: MASTER, username: USER_X.username, password: USER_X.password });

    const res = await request(app.getHttpServer())
      .get(`/realms/${MASTER}/roles`)
      .set('Authorization', `Bearer ${userXToken}`);

    expect(res.status).toBe(403);
  });

  it('40: userX tries to login to pawn realm and read roles — access denied', async () => {
    // userX only exists in master, so login into pawn fails outright.
    const res = await request(app.getHttpServer())
      .post(`/auth/${PAWN}/login`)
      .send({ username: USER_X.username, password: USER_X.password });

    expect([401, 404]).toContain(res.status);
  });

  it('41: userY logs in and reads roles under pawn realm — success (inherited via ManagerB)', async () => {
    const userYToken = await login(app, { realmName: PAWN, username: USER_Y.username, password: USER_Y.password });

    await request(app.getHttpServer())
      .get(`/realms/${PAWN}/roles`)
      .set('Authorization', `Bearer ${userYToken}`)
      .expect(200);
  });

  it('42: userY tries to login to master realm and read roles — access denied', async () => {
    // userY only exists in pawn, so login into master fails outright.
    const res = await request(app.getHttpServer())
      .post(`/auth/${MASTER}/login`)
      .send({ username: USER_Y.username, password: USER_Y.password });

    expect([401, 404]).toContain(res.status);
  });
});
