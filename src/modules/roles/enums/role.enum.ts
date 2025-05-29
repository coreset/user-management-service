export enum FixedUserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  USER = 'USER',
}

export type UserRole = FixedUserRole | (string & {});
