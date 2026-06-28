import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Actual per-user custom attribute values. The attribute_key must exist in
 * attribute_definitions (validated in code) — there is no DB FK between them.
 */
@Entity('user_attributes')
@Unique(['user', 'attributeKey'])
export class UserAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'attribute_key' })
  attributeKey: string;

  @Column({ name: 'attribute_value', type: 'text' })
  attributeValue: string;

  // copied from attribute_definitions on write; drives casting/validation
  @Column({ name: 'attribute_type' })
  attributeType: string;

  @Column({ name: 'is_encrypted', default: false })
  isEncrypted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
