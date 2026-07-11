/**
 * Canonical permission strings. Seeded into the `permissions` table per realm
 * (permissions are realm-scoped, UNIQUE(realm_id, name)) and assigned to roles via
 * `realm_role_permissions` / `client_role_permissions`. Referenced by @Permissions(...)
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
   * admin attach ANY permission (e.g. realms:delete) to a role in their own realm
   * and then assign that role to themselves, escalating past their intended scope.
   */
  ROLES_ASSIGN_PERMISSIONS = 'roles:assign-permissions',
  CLIENTS_CREATE = 'clients:create',
  CLIENTS_READ = 'clients:read',
  CLIENTS_UPDATE = 'clients:update',
  CLIENTS_DELETE = 'clients:delete',
  CLIENT_ROLES_CREATE = 'client-roles:create',
  CLIENT_ROLES_READ = 'client-roles:read',
  CLIENT_ROLES_DELETE = 'client-roles:delete',
  /** Add/remove which USERS hold a client role. Safe to grant to REALM_ADMIN. */
  CLIENT_ROLES_ASSIGN_USERS = 'client-roles:assign-users',
  /** Add/remove which PERMISSIONS a client role grants. */
  CLIENT_ROLES_ASSIGN_PERMISSIONS = 'client-roles:assign-permissions',
  REALMS_CREATE = 'realms:create',
  REALMS_READ = 'realms:read',
  REALMS_UPDATE = 'realms:update',
  REALMS_DELETE = 'realms:delete',
  SETTINGS_MANAGE = 'settings:manage',
  USER_ATTRIBUTES_MANAGE = 'user-attributes:manage',
  AUDIT_READ = 'audit:read',
  /** Manage a realm's permission catalog (permissions table). SUPER_ADMIN-only. */
  PERMISSIONS_CREATE = 'permissions:create',
  PERMISSIONS_READ = 'permissions:read',
  PERMISSIONS_UPDATE = 'permissions:update',
  PERMISSIONS_DELETE = 'permissions:delete',
}
