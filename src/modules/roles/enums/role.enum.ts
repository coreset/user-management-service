export enum FixedUserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  REALM_ADMIN = 'REALM_ADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  USER = 'USER',
}

export type UserRole = FixedUserRole | (string & {});
