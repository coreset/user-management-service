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
  CLIENTS_MANAGE = 'clients:manage',
  REALMS_MANAGE = 'realms:manage',
  SETTINGS_MANAGE = 'settings:manage',
  USER_ATTRIBUTES_MANAGE = 'user-attributes:manage',
  AUDIT_READ = 'audit:read',
}
