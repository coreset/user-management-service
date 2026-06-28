import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Realm } from '../../realms/entities/realm.entity';
import { ClientSession } from './client-session.entity';

/**
 * Realm-level SSO session — one row per user login. Enables single sign-on
 * across clients in the realm and drives idle/max-lifetime timeouts. Revoking
 * this session (is_active = false) signs the user out of every client.
 */
@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Realm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'realm_id' })
  realm: Realm;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'remember_me', default: false })
  rememberMe: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'last_seen_at', type: 'timestamp', nullable: true })
  lastSeenAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @OneToMany(() => ClientSession, (cs) => cs.userSession)
  clientSessions: ClientSession[];
}
