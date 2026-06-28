import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { AuthorizationCode } from '../../auth/entities/authorization-code.entity';
import { AccessToken } from '../../auth/entities/access-token.entity';
import { UserVerificationIdentifier } from '../../auth/entities/user-verification-identifier.entity';
import { Realm } from '../../realms/entities/realm.entity';
import { ClientRole } from './client-role.entity';
import { UserClientRole } from './user-client-role.entity';
import { Audited } from '../../../common/audit/audited.decorator';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

@Audited()
@Entity('clients')
@Unique(['realm', 'clientId'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Realm, (realm) => realm.clients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'realm_id' })
  realm!: Realm;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'client_id' })
  clientId!: string;

  @Column({ nullable: true, type: 'varchar', name: 'client_secret' })
  clientSecret!: string | null;

  @Column({ name: 'public_client', default: false })
  publicClient!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'text', name: 'redirect_uris' })
  redirectUris!: string; // comma-separated or JSON string

  @Column({ type: 'text', name: 'grant_types' })
  grantTypes!: string; // comma-separated or JSON string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => AuthorizationCode, (code) => code.client)
  authorizationCodes: AuthorizationCode[];

  @OneToMany(() => AccessToken, (token) => token.client)
  accessTokens: AccessToken[];

  @OneToMany(() => UserVerificationIdentifier, (v) => v.client)
  verificationIdentifiers!: UserVerificationIdentifier[];

  @OneToMany(() => ClientRole, (clientRole) => clientRole.client)
  clientRoles!: ClientRole[];

  @OneToMany(() => UserClientRole, (ucr) => ucr.client)
  userClientRoles!: UserClientRole[];

  @OneToMany(() => RefreshToken, (token) => token.client)
  refreshTokens!: RefreshToken[];
}
