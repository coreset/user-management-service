import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * Central, append-only, hash-chained audit trail.
 *
 * Records two kinds of events:
 *  - DATA  → entity INSERT/UPDATE/DELETE (written by AuditSubscriber)
 *  - AUTH  → login/logout/password-change etc. (written explicitly)
 *
 * Actor and realm are denormalized SNAPSHOTS (no FK) so the trail stays
 * meaningful even if the user/realm is later changed or removed.
 * Never UPDATE/DELETE a row — the chain (prev_hash -> row_hash) makes any
 * tampering detectable.
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'category', length: 20 }) // 'DATA' | 'AUTH'
  category: string;

  @Index()
  @Column({ name: 'action', length: 60 }) // INSERT/UPDATE/DELETE | USER_LOGIN | ...
  action: string;

  @Index()
  @Column({ name: 'table_name', type: 'varchar', length: 100, nullable: true })
  tableName?: string | null;

  @Index()
  @Column({ name: 'record_id', type: 'varchar', length: 100, nullable: true })
  recordId?: string | null;

  @Column({ name: 'old_values', type: 'json', nullable: true })
  oldValues?: Record<string, unknown> | null;

  @Column({ name: 'new_values', type: 'json', nullable: true })
  newValues?: Record<string, unknown> | null;

  @Column({ name: 'changed_fields', type: 'json', nullable: true })
  changedFields?: string[] | null;

  @Column({ name: 'status', type: 'varchar', length: 20, nullable: true }) // SUCCESS | FAILURE
  status?: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress?: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string | null;

  // denormalized snapshots — intentionally not FKs
  @Index()
  @Column({ name: 'realm_id', type: 'varchar', length: 100, nullable: true })
  realmId?: string | null;

  @Index()
  @Column({ name: 'actor_id', type: 'varchar', length: 100, nullable: true })
  actorId?: string | null;

  @Column({ name: 'actor_username', type: 'varchar', length: 150, nullable: true })
  actorUsername?: string | null;

  // hash chain: row_hash = sha256(prev_hash + canonical(payload))
  @Column({ name: 'prev_hash', type: 'varchar', length: 64, nullable: true })
  prevHash?: string | null;

  @Column({ name: 'row_hash', length: 64 })
  rowHash: string;

  // microsecond precision keeps the chain order deterministic
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}
