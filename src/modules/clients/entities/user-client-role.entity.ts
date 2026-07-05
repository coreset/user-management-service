import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from './client.entity';
import { ClientRole } from './client-role.entity';

@Entity('user_client_roles')
@Unique(['user', 'clientRole'])
export class UserClientRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.userClientRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Client, (client) => client.userClientRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => ClientRole, (clientRole) => clientRole.userClientRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_role_id' })
  clientRole: ClientRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
