import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Metadata catalog of valid REALM_SETTINGS keys (allow-list / rulebook).
 * Standalone reference table — no FK to realm_settings. The code is the master
 * list and the seeder projects it here; the app validates a setting key against
 * this table before saving it to realm_settings.
 */
@Entity('setting_definitions')
export class SettingDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'setting_key', unique: true })
  settingKey: string;

  @Column({ name: 'value_type' })
  valueType: string; // string | int | boolean | json | text | decimal | timestamp

  @Column({ name: 'default_value', type: 'text', nullable: true })
  defaultValue: string | null;

  @Column({ name: 'is_encrypted', default: false })
  isEncrypted: boolean;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'validation', nullable: true })
  validation: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
