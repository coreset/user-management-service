import { Role } from 'src/modules/roles/entities/role.entity';

export type CurrentUser = {
  id: number;
  roles: Array<Role>;
};
