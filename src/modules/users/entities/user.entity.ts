import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
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
import { Role } from 'src/modules/roles/entities/role.entity';
import { Realm } from 'src/modules/realms/entities/realm.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
@Unique(['realm', 'username'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Realm, (realm) => realm.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'realm_id' })
  realm!: Realm;

  @Column({ name: 'username', length: 100 })
  username!: string;

  @Column({ unique: true, name: 'email' })
  email: string;

  @Column({ name: 'password_hash' })
  @Exclude() // This hides the field from response
  passwordHash!: string;

  @Column({ length: 100, name: 'first_name' })
  firstName: string;

  @Column({ length: 100, name: 'last_name' })
  lastName: string;

  //@Column({ default: 'https://default-avatar.com/avatar.png' })
  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  @Column({ default: true, name: 'is_active' })
  isActive!: boolean;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  /* Many-to-Many
   * user-1 can have 'USER' and 'EDITOR' roles
   * user-1 and user-2 can have 'EDITOR' role.
   **/

  @ManyToMany(() => Role, (role) => role.users, { cascade: true })
  roles: Role[];

  @CreateDateColumn({ name: 'created_at'})
  createdAt: Date;

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
