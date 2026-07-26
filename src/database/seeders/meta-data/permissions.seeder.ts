import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Permission } from '../../../modules/permission/entities/permission.entity';
import { RealmRole } from '../../../modules/roles/entities/realm-role.entity';
import { Realm } from '../../../modules/realms/entities/realm.entity';
import { FixedUserRole } from '../../../modules/roles/enums/role.enum';
import { PermissionKey } from '../../../modules/permission/constants/permission-key.enum';

/**
 * Permissions granted to REALM_ADMIN. SUPER_ADMIN always gets every permission
 * (including the realms:* CRUD keys / AUDIT_READ / ROLES_ASSIGN_PERMISSIONS, which
 * REALM_ADMIN deliberately does not — see PermissionKey.ROLES_ASSIGN_PERMISSIONS'
 * doc comment: granting it here would let a realm admin attach any permission,
 * including realm-management ones, to a role in their own realm.
 */
const REALM_ADMIN_PERMISSIONS: PermissionKey[] = [
  PermissionKey.USERS_CREATE,
  PermissionKey.USERS_READ,
  PermissionKey.USERS_DELETE,
  PermissionKey.ROLES_CREATE,
  PermissionKey.ROLES_READ,
  PermissionKey.ROLES_UPDATE,
  PermissionKey.ROLES_DELETE,
  PermissionKey.ROLES_ASSIGN_USERS,
  PermissionKey.CLIENTS_CREATE,
  PermissionKey.CLIENTS_READ,
  PermissionKey.CLIENTS_UPDATE,
  PermissionKey.CLIENTS_DELETE,
  PermissionKey.CLIENT_ROLES_CREATE,
  PermissionKey.CLIENT_ROLES_READ,
  PermissionKey.CLIENT_ROLES_DELETE,
  PermissionKey.CLIENT_ROLES_ASSIGN_USERS,
  // CLIENT_ROLES_ASSIGN_PERMISSIONS intentionally omitted (SUPER_ADMIN-only):
  // client-role permissions are flattened into a user's effective permissions,
  // so granting it would let a realm admin escalate — same reasoning as
  // ROLES_ASSIGN_PERMISSIONS.
  PermissionKey.SETTINGS_MANAGE,
  PermissionKey.USER_ATTRIBUTES_MANAGE,
  PermissionKey.DASHBOARD_READ,
];

/**
 * Seeds the `master` realm's permission catalog and assigns it to that realm's
 * SUPER_ADMIN / REALM_ADMIN roles. Permissions are realm-scoped
 * (UNIQUE(realm_id, name)), so this seeds the base PermissionKey set for master.
 *
 * Only `master` is handled: it is the realm created by MasterRealmSeeder. Tenant
 * realms are created via the API and bootstrap their own permissions there.
 *
 * Must run AFTER MasterRealmSeeder (needs the master realm + its role rows).
 */
export class PermissionsSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const realmRepo = dataSource.getRepository(Realm);
    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(RealmRole);

    const masterRealmName = process.env.MASTER_REALM_NAME || 'master';
    const realm = await realmRepo.findOne({
      where: { realmName: masterRealmName },
    });
    if (!realm) {
      console.warn(
        `Master realm '${masterRealmName}' not found; skipping permission seeding`,
      );
      return;
    }

    // 1. Ensure every permission key exists as a row for the master realm ------
    const permissionsByName = new Map<string, Permission>();
    for (const name of Object.values(PermissionKey)) {
      let permission = await permissionRepo.findOne({
        where: { name, realm: { id: realm.id } },
      });
      if (!permission) {
        permission = await permissionRepo.save(
          permissionRepo.create({ name, realm: { id: realm.id } as Realm, isSystem: true }),
        );
        // console.log(`Permission '${name}' created in realm '${realm.realmName}'`);
      } else if (!permission.isSystem) {
        // Backfill for permissions seeded before isSystem existed.
        permission.isSystem = true;
        permission = await permissionRepo.save(permission);
      }
      permissionsByName.set(name, permission);
    }
    const allPermissions = Array.from(permissionsByName.values());
    const realmAdminPermissions = REALM_ADMIN_PERMISSIONS.map(
      (key) => permissionsByName.get(key)!,
    );

    // 2. Assign to the master realm's SUPER_ADMIN / REALM_ADMIN roles ----------
    const superAdminRole = await roleRepo.findOne({
      where: { name: FixedUserRole.SUPER_ADMIN, realm: { id: realm.id } },
      relations: ['permissions'],
    });
    if (superAdminRole) {
      superAdminRole.permissions = allPermissions;
      await roleRepo.save(superAdminRole);
    }

    const realmAdminRole = await roleRepo.findOne({
      where: { name: FixedUserRole.REALM_ADMIN, realm: { id: realm.id } },
      relations: ['permissions'],
    });
    if (realmAdminRole) {
      realmAdminRole.permissions = realmAdminPermissions;
      await roleRepo.save(realmAdminRole);
    }

    console.log(
      `Realm '${realm.realmName}': permissions assigned ` +
        `(SUPER_ADMIN: ${superAdminRole ? 'yes' : 'no'}, ` +
        `REALM_ADMIN: ${realmAdminRole ? 'yes' : 'no'})`,
    );
  }
}
