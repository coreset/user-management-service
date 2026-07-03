import { Role } from 'src/modules/roles/entities/role.entity';

export type CurrentUser = {
  id: string;
  realmId?: string;
  roles: Array<Role>;
  /** Flattened permission names granted by all of the user's roles. */
  permissions: string[];
};
