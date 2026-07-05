import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
  DeleteDateColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Realm } from '../../realms/entities/realm.entity';
import { Client } from './client.entity';
import { UserClientRole } from './user-client-role.entity';
import { Permission } from '../../permission/entities/permission.entity';
import { Audited } from '../../../common/audit/audited.decorator';

@Audited()
@Entity('client_roles')
@Unique(['client', 'name'])
export class ClientRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Realm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'realm_id' })
  realm: Realm;

  @ManyToOne(() => Client, (client) => client.clientRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'name' })
  name: string;

  @Column({ nullable: true, name: 'description' })
  description: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  @Exclude()
  deletedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => UserClientRole, (ucr) => ucr.clientRole)
  userClientRoles: UserClientRole[];

  @ManyToMany(() => Permission, (permission) => permission.clientRoles, { cascade: true })
  @JoinTable({
    name: 'client_role_permissions',
    joinColumn: { name: 'client_role_id' },
    inverseJoinColumn: { name: 'permission_id' },
  })
  permissions: Permission[];
}
