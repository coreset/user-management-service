import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Permission } from '../../../modules/permission/entities/permission.entity';
import { RealmRole } from '../../../modules/roles/entities/role.entity';
import { FixedUserRole } from '../../../modules/roles/enums/role.enum';
import { PermissionKey } from '../../../modules/permission/constants/permission-key.enum';

/**
 * Permissions granted to REALM_ADMIN. SUPER_ADMIN always gets every permission
 * (including REALMS_MANAGE / AUDIT_READ / ROLES_ASSIGN_PERMISSIONS, which
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
  PermissionKey.CLIENTS_MANAGE,
  PermissionKey.SETTINGS_MANAGE,
  PermissionKey.USER_ATTRIBUTES_MANAGE,
];

/**
 * Seeds every PermissionKey as a Permission row (idempotent), then assigns the
 * full set to SUPER_ADMIN and the realm-management subset to REALM_ADMIN — for
 * every realm's roles, not just master, so tenant realms created later aren't
 * left with empty (i.e. locked-out) role permissions.
 *
 * Must run AFTER MasterRealmSeeder (needs SUPER_ADMIN/REALM_ADMIN role rows to
 * exist for at least the master realm).
 */
export class PermissionsSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(RealmRole);

    // 1. Ensure every permission key exists as a row -------------------------
    const allKeys = Object.values(PermissionKey);
    const permissionsByName = new Map<string, Permission>();
    for (const name of allKeys) {
      let permission = await permissionRepo.findOne({ where: { name } });
      if (!permission) {
        permission = await permissionRepo.save(permissionRepo.create({ name }));
        console.log(`Permission '${name}' created`);
      }
      permissionsByName.set(name, permission);
    }
    const allPermissions = Array.from(permissionsByName.values());
    const realmAdminPermissions = REALM_ADMIN_PERMISSIONS.map(
      (key) => permissionsByName.get(key)!,
    );

    // 2. Assign to every SUPER_ADMIN / REALM_ADMIN role across all realms ----
    const superAdminRoles = await roleRepo.find({
      where: { name: FixedUserRole.SUPER_ADMIN },
      relations: ['permissions'],
    });
    for (const role of superAdminRoles) {
      role.permissions = allPermissions;
      await roleRepo.save(role);
    }

    const realmAdminRoles = await roleRepo.find({
      where: { name: FixedUserRole.REALM_ADMIN },
      relations: ['permissions'],
    });
    for (const role of realmAdminRoles) {
      role.permissions = realmAdminPermissions;
      await roleRepo.save(role);
    }

    console.log(
      `Permissions assigned: ${superAdminRoles.length} SUPER_ADMIN role(s), ${realmAdminRoles.length} REALM_ADMIN role(s)`,
    );
  }
}
