import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserSession } from './user-session.entity';
import { Client } from '../../clients/entities/client.entity';
import { RefreshToken } from './refresh-token.entity';

/**
 * Per-client sub-session inside a user session. One is created for each client
 * the user accesses during the SSO session; refresh tokens map to it.
 */
@Entity('client_sessions')
export class ClientSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserSession, (us) => us.clientSessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_session_id' })
  userSession: UserSession;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'last_seen_at', type: 'timestamp', nullable: true })
  lastSeenAt: Date | null;

  @OneToMany(() => RefreshToken, (rt) => rt.clientSession)
  refreshTokens: RefreshToken[];
}
