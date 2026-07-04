import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { AuthorizationCode } from '../../auth/entities/authorization-code.entity';
import { AccessToken } from '../../auth/entities/access-token.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { UserVerificationIdentifier } from '../../auth/entities/user-verification-identifier.entity';
import * as bcrypt from 'bcrypt';
import { RealmRole } from 'src/modules/roles/entities/role.entity';
import { Realm } from 'src/modules/realms/entities/realm.entity';
import { Exclude } from 'class-transformer';
import { Audited } from '../../../common/audit/audited.decorator';

@Audited()
@Entity('users')
@Unique(['realm', 'username'])
@Unique(['realm', 'email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Realm, (realm) => realm.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'realm_id' })
  realm!: Realm;

  @Column({ name: 'username', length: 100 })
  username!: string;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'password_hash' })
  @Exclude() // This hides the field from response
  passwordHash!: string;

  @Column({ name: 'phone_number', type: 'varchar', nullable: true })
  phoneNumber: string | null;

  @Column({ name: 'is_phone_verified', default: false })
  isPhoneVerified: boolean;

  @Column({ length: 100, name: 'first_name' })
  firstName: string;

  @Column({ length: 100, name: 'last_name' })
  lastName: string;

  //@Column({ default: 'https://default-avatar.com/avatar.png' })
  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  @Column({ default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'last_login_ip', type: 'varchar', length: 64, nullable: true })
  lastLoginIp: string | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  /* Many-to-Many
   * user-1 can have 'USER' and 'EDITOR' roles
   * user-1 and user-2 can have 'EDITOR' role.
   **/

  @ManyToMany(() => RealmRole, (role) => role.users, { cascade: true })
  roles: RealmRole[];

  @CreateDateColumn({ name: 'created_at'})
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => AuthorizationCode, (code) => code.user)
  authorizationCodes: AuthorizationCode[];

  @OneToMany(() => AccessToken, (token) => token.user)
  accessTokens: AccessToken[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => UserVerificationIdentifier, (v) => v.user)
  verificationIdentifiers!: UserVerificationIdentifier[];

  @BeforeInsert()
  async hashPassword() {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  }
}
