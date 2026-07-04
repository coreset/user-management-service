/**
 * Canonical permission strings, seeded into the `permissions` table and
 * assigned to roles via `realm_role_permissions`. Referenced by @Permissions(...)
 * decorators; the actual name stored in the DB must match these values exactly.
 */
export enum PermissionKey {
  USERS_CREATE = 'users:create',
  USERS_READ = 'users:read',
  USERS_DELETE = 'users:delete',
  ROLES_CREATE = 'roles:create',
  ROLES_READ = 'roles:read',
  ROLES_UPDATE = 'roles:update',
  ROLES_DELETE = 'roles:delete',
  /** Add/remove which USERS hold a role. Safe to grant to REALM_ADMIN. */
  ROLES_ASSIGN_USERS = 'roles:assign-users',
  /**
   * Add/remove which PERMISSIONS a role grants. Deliberately kept SUPER_ADMIN-only
   * (see permissions.seeder.ts) — granting this to REALM_ADMIN would let a realm
   * admin attach ANY permission (e.g. realms:manage) to a role in their own realm
   * and then assign that role to themselves, escalating past their intended scope.
   */
  ROLES_ASSIGN_PERMISSIONS = 'roles:assign-permissions',
  CLIENTS_MANAGE = 'clients:manage',
  REALMS_MANAGE = 'realms:manage',
  SETTINGS_MANAGE = 'settings:manage',
  USER_ATTRIBUTES_MANAGE = 'user-attributes:manage',
  AUDIT_READ = 'audit:read',
}
