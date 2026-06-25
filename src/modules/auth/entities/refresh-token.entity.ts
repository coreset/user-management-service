import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
//import { Client } from '../../clients/entities/client.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryColumn()
  token: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  //@ManyToOne(() => Client, (client) => client.refreshTokens)
  //@JoinColumn({ name: 'client_id', referencedColumnName: 'client_id' })
  //client: Client;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
