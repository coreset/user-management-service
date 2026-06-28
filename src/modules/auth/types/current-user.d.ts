import { Role } from 'src/modules/roles/entities/role.entity';

export type CurrentUser = {
  id: string;
  realmId?: string;
  roles: Array<Role>;
};
