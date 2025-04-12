import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';

@Entity('authorization_codes')
export class AuthorizationCode {
  @PrimaryColumn()
  code: string;

  @ManyToOne(() => User, (user) => user.authorizationCodes)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Client, (client) => client.authorizationCodes)
  @JoinColumn({ name: 'client_id', referencedColumnName: 'client_id' })
  client: Client;

  @Column('text')
  redirect_uri: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;
}
