import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RealmKey } from './realm-key.entity';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('realms')
export class Realm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'realm_name', unique: true })
  realmName: string;

  @Column({ name: 'display_name', nullable: true })
  displayName: string;

  @Column({ default: true, name: 'enabled' })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => RealmKey, (key) => key.realm)
  keys: RealmKey[];

  @OneToMany(() => User, (user) => user.realm)
  users: User[];

  @OneToMany(() => Client, (client) => client.realm)
  clients: Client[];

  @OneToMany(() => Role, (role) => role.realm)
  roles: Role[];
}
