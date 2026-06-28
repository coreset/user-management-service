import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';

@Entity('user_verification_identifiers')
export class UserVerificationIdentifier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'token' })
  token: string; // Hashed version only

  @Column({ type: 'varchar', length: 10, name: 'type' })
  type: string; //'email' | 'code'; // Token type

  @ManyToOne(() => User, (user) => user.verificationIdentifiers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Client, (client) => client.verificationIdentifiers)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  // this field not use currenly
  @Column({ name: 'used', default: false })
  used: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
