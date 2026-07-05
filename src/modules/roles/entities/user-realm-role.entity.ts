import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Realm } from '../../realms/entities/realm.entity';
import { RealmRole } from './realm-role.entity';

@Entity('user_realm_roles')
@Unique(['user', 'realmRole'])
export class UserRealmRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.userRealmRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Realm, (realm) => realm.userRealmRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'realm_id' })
  realm: Realm;

  @ManyToOne(() => RealmRole, (realmRole) => realmRole.userRealmRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'realm_role_id' })
  realmRole: RealmRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
