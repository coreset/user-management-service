import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { UserRole } from '../enums/role.enum';
import { Realm } from 'src/modules/realms/entities/realm.entity';
import { Permission } from 'src/modules/permission/entities/permission.entity';
import { UserRealmRole } from './user-realm-role.entity';
import { Exclude } from 'class-transformer';
import { Audited } from '../../../common/audit/audited.decorator';

@Audited()
@Entity('realm_roles')
@Unique(['realm', 'name'])
export class RealmRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'name' })
  name: UserRole;

  @DeleteDateColumn({ name: 'deleted_at' })
  @Exclude()
  deletedAt: Date;

  @ManyToOne(() => Realm, (realm) => realm.roles, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'realm_id' })
  realm!: Realm;

  @ManyToMany(() => Permission, (permission) => permission.realmRoles, { cascade: true })
  @JoinTable({
    name: 'realm_role_permissions',
    joinColumn: { name: 'realm_role_id' },
    inverseJoinColumn: { name: 'permission_id' },
  })
  permissions: Permission[];

  @OneToMany(() => UserRealmRole, (userRealmRole) => userRealmRole.realmRole)
  userRealmRoles: UserRealmRole[];
}
