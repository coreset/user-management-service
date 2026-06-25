import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
} from 'typeorm';
import { FixedUserRole, UserRole } from '../enums/role.enum';
import { Client } from 'src/modules/clients/entities/client.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Permission } from 'src/modules/permission/entities/permission.entity';
import { Exclude } from 'class-transformer';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    unique: true,
  })
  name: UserRole;

  @DeleteDateColumn({ name: 'deleted_at' })
  @Exclude()
  deletedAt: Date;

  @ManyToOne(() => Client, (client) => client.roles)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: true })
  @JoinTable({
    name: 'role_permissions',
  })
  permissions: Permission[];

  @ManyToMany(() => User, (user) => user.roles)
  @JoinTable({
    name: 'user_roles',
  })
  users: User[];
}
