import { RealmRole } from 'src/modules/roles/entities/realm-role.entity';

export type CurrentUser = {
  id: string;
  realmId?: string;
  realmName?: string;
  roles: Array<RealmRole>;
  /** Flattened permission names granted by all of the user's roles. */
  permissions: string[];
};
