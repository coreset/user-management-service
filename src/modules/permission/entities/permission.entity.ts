import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { RealmRole } from 'src/modules/roles/entities/realm-role.entity';
import { ClientRole } from 'src/modules/clients/entities/client-role.entity';
import { Realm } from 'src/modules/realms/entities/realm.entity';
import { Exclude } from 'class-transformer';
import { Audited } from '../../../common/audit/audited.decorator';

@Audited()
@Entity('permissions')
@Unique(['realm', 'name'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  @DeleteDateColumn({ name: 'deleted_at' })
  @Exclude()
  deletedAt: Date;

  @ManyToOne(() => Realm, (realm) => realm.permissions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'realm_id' })
  realm!: Realm;

  @ManyToMany(() => RealmRole, (realmRole) => realmRole.permissions)
  realmRoles: RealmRole[];

  @ManyToMany(() => ClientRole, (clientRole) => clientRole.permissions)
  clientRoles: ClientRole[];
}
