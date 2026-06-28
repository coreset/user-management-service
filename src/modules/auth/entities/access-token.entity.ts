import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';

@Entity('access_tokens')
export class AccessToken {
  @PrimaryColumn()
  token: string;

  @ManyToOne(() => User, (user) => user.accessTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Client, (client) => client.accessTokens)
  @JoinColumn({ name: 'client_id', referencedColumnName: 'id' })
  client: Client;

  @Column({ name: 'scope' })
  scope: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt!: Date;
}
