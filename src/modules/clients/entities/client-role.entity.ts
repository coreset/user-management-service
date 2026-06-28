import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  DeleteDateColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Realm } from '../../realms/entities/realm.entity';
import { Client } from './client.entity';
import { UserClientRole } from './user-client-role.entity';

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
}
