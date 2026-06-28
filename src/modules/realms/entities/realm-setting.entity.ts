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
import { Realm } from './realm.entity';

/**
 * Actual per-realm setting values. The setting_key must exist in
 * setting_definitions (validated in code) — there is no DB FK between them.
 */
@Entity('realm_settings')
@Unique(['realm', 'settingKey'])
export class RealmSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Realm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'realm_id' })
  realm: Realm;

  @Column({ name: 'setting_key' })
  settingKey: string;

  @Column({ name: 'setting_value', type: 'text' })
  settingValue: string;

  // copied from setting_definitions on write; drives casting/validation
  @Column({ name: 'value_type' })
  valueType: string;

  @Column({ name: 'is_encrypted', default: false })
  isEncrypted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
