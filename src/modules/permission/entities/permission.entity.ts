import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  DeleteDateColumn,
} from 'typeorm';
import { RealmRole } from 'src/modules/roles/entities/realm-role.entity';
import { ClientRole } from 'src/modules/clients/entities/client-role.entity';
import { Exclude } from 'class-transformer';
import { Audited } from '../../../common/audit/audited.decorator';

@Audited()
@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'name' })
  name: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  @Exclude()
  deletedAt: Date;

  @ManyToMany(() => RealmRole, (realmRole) => realmRole.permissions)
  realmRoles: RealmRole[];

  @ManyToMany(() => ClientRole, (clientRole) => clientRole.permissions)
  clientRoles: ClientRole[];
}
