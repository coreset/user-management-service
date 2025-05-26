import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  BeforeInsert,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { AuthorizationCode } from '../../auth/entities/authorization-code.entity';
import { AccessToken } from '../../auth/entities/access-token.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/modules/roles/entities/role.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude() // This hides the field from response
  password: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  //@Column({ default: 'https://default-avatar.com/avatar.png' })
  @Column({ nullable: true })
  avatarUrl: string;

  /* Many-to-Many
   * user-1 can have 'USER' and 'EDITOR' roles
   * user-1 and user-2 can have 'EDITOR' role.
   **/

  @ManyToMany(() => Role, (role) => role.users, { cascade: true })
  @JoinTable({
    name: 'user_roles',
  })
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => AuthorizationCode, (code) => code.user)
  authorizationCodes: AuthorizationCode[];

  @OneToMany(() => AccessToken, (token) => token.user)
  accessTokens: AccessToken[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
