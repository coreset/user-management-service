import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Metadata catalog of valid USER_ATTRIBUTES keys (allow-list / rulebook).
 * Standalone reference table — no FK to user_attributes. Seeded with default
 * keys; the app validates an attribute key against this table before saving it
 * to user_attributes.
 */
@Entity('attribute_definitions')
export class AttributeDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'attribute_key', unique: true })
  attributeKey: string;

  @Column({ name: 'value_type' })
  valueType: string; // string | int | boolean | json | date | decimal | text | timestamp

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ name: 'is_encrypted', default: false })
  isEncrypted: boolean;

  @Column({ name: 'default_value', type: 'text', nullable: true })
  defaultValue: string | null;

  @Column({ name: 'validation', nullable: true })
  validation: string | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
