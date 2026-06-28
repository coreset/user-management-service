import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { UserRole } from '../enums/role.enum';
import { Realm } from 'src/modules/realms/entities/realm.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Permission } from 'src/modules/permission/entities/permission.entity';
import { Exclude } from 'class-transformer';
import { Audited } from '../../../common/audit/audited.decorator';

@Audited()
@Entity('realm_roles')
@Unique(['realm', 'name'])
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'name' })
  name: UserRole;

  @DeleteDateColumn({ name: 'deleted_at' })
  @Exclude()
  deletedAt: Date;

  @ManyToOne(() => Realm, (realm) => realm.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'realm_id' })
  realm!: Realm;

  @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: true })
  @JoinTable({
    name: 'realm_role_permissions',
  })
  permissions: Permission[];

  @ManyToMany(() => User, (user) => user.roles)
  @JoinTable({
    name: 'user_realm_roles',
  })
  users: User[];
}
