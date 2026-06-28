import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Realm } from './realm.entity';

@Entity('realm_keys')
export class RealmKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Realm, (realm) => realm.keys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'realm_id' })
  realm: Realm;

  @Column({ length: 100, name: 'kid' })
  kid: string;

  @Column({ length: 20, default: 'RS256', name: 'algorithm' })
  algorithm: string;

  @Column({ name: 'key_type', length: 20, default: 'RSA' })
  keyType: string;

  @Column({ name: 'private_key', type: 'text' })
  @Exclude() // Stored securely; never exposed in API responses
  privateKey: string;

  @Column({ name: 'public_key', type: 'text' })
  publicKey: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;
}
