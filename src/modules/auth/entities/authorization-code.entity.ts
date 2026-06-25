import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';

@Entity('authorization_codes')
export class AuthorizationCode {
  @PrimaryColumn()
  code: string;

  @ManyToOne(() => User, (user) => user.authorizationCodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Client, (client) => client.authorizationCodes)
  @JoinColumn({ name: 'client_id', referencedColumnName: 'client_id' })
  client: Client;

  @Column({ type: 'text', name: 'redirect_uri' })
  redirectUri: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;
}
