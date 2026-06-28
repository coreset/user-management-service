import { EntityManager } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { computeRowHash, HashPayload } from './audit-hash';

/** Loose input — any field may be omitted; appendAuditLog normalizes to nulls. */
export type AuditEntryInput = Partial<HashPayload> &
  Pick<HashPayload, 'category' | 'action'>;

/**
 * Appends one row to the hash-chained audit_logs table. Both the subscriber and
 * explicit auth-event logging go through here so the chain stays consistent.
 *
 * NOTE: the chain links to the latest existing row. Under heavy concurrent
 * writes two rows could read the same prev_hash; a production setup would
 * serialize this (queue or SELECT ... FOR UPDATE). Fine for current volume.
 */
export async function appendAuditLog(
  manager: EntityManager,
  input: AuditEntryInput,
): Promise<AuditLog> {
  // Normalize to a fully-populated payload so write-time and verify-time hash
  // over the exact same key set.
  const payload: HashPayload = {
    category: input.category,
    action: input.action,
    tableName: input.tableName ?? null,
    recordId: input.recordId ?? null,
    oldValues: input.oldValues ?? null,
    newValues: input.newValues ?? null,
    changedFields: input.changedFields ?? null,
    status: input.status ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    realmId: input.realmId ?? null,
    actorId: input.actorId ?? null,
    actorUsername: input.actorUsername ?? null,
  };

  const prev = await manager.findOne(AuditLog, {
    where: {},
    order: { createdAt: 'DESC', id: 'DESC' },
  });
  const prevHash = prev?.rowHash ?? null;
  const rowHash = computeRowHash(prevHash, payload);

  const audit = manager.create(AuditLog, { ...payload, prevHash, rowHash });
  return manager.save(audit);
}
