import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { AuthorizationCode } from '../../auth/entities/authorization-code.entity';
import { AccessToken } from '../../auth/entities/access-token.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/modules/roles/entities/role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  //@Column({ default: 'https://default-avatar.com/avatar.png' })
  @Column({ nullable: true })
  avatarUrl: string;

  @OneToMany(() => Role, (role) => role.user)
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
