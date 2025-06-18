import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Role } from 'src/modules/roles/entities/role.entity';
import { Exclude } from 'class-transformer';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  @Exclude()
  deletedAt: Date;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
