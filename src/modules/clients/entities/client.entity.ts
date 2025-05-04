import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { AuthorizationCode } from '../../auth/entities/authorization-code.entity';
import { AccessToken } from '../../auth/entities/access-token.entity';
//import { RefreshToken } from '../../auth/entities/refresh-token.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  client_id: string;

  @Column()
  client_secret: string;

  @Column('text')
  redirect_uris: string; // comma-separated or JSON string

  @Column('text')
  grant_types: string; // comma-separated or JSON string

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => AuthorizationCode, (code) => code.client)
  authorizationCodes: AuthorizationCode[];

  @OneToMany(() => AccessToken, (token) => token.client)
  accessTokens: AccessToken[];

  //@OneToMany(() => RefreshToken, (token) => token.client)
  //refreshTokens: RefreshToken[];
}
