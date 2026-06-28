import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  EntityMetadata,
  EntitySubscriberInterface,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { isAudited } from './audited.decorator';
import { auditContext } from './audit-context';
import { appendAuditLog } from './audit-writer';

const REDACTED = '***REDACTED***';
// columns never stored in plaintext in the audit trail
const SENSITIVE_COLUMNS = new Set([
  'passwordHash',
  'privateKey',
  'clientSecret',
]);

/**
 * Captures INSERT/UPDATE/DELETE on @Audited() entities into the append-only,
 * hash-chained audit_logs table. Registered manually (constructor) so it
 * participates in Nest DI while remaining a real TypeORM subscriber.
 */
@Injectable()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  afterInsert(event: InsertEvent<unknown>): Promise<void> {
    return this.record(event.manager, event.metadata, 'INSERT', undefined, event.entity);
  }

  afterUpdate(event: UpdateEvent<unknown>): Promise<void> {
    return this.record(event.manager, event.metadata, 'UPDATE', event.databaseEntity, event.entity);
  }

  afterRemove(event: RemoveEvent<unknown>): Promise<void> {
    return this.record(
      event.manager,
      event.metadata,
      'DELETE',
      event.databaseEntity ?? event.entity,
      undefined,
    );
  }

  private async record(
    manager: EntityManager,
    metadata: EntityMetadata,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    oldEntity: unknown,
    newEntity: unknown,
  ): Promise<void> {
    if (!isAudited(metadata.target)) return;

    const columns = metadata.columns.map((c) => c.propertyName);
    const oldValues = oldEntity ? this.extract(columns, oldEntity) : null;
    const newValues = newEntity ? this.extract(columns, newEntity) : null;

    let changedFields: string[] | null = null;
    if (action === 'UPDATE' && oldValues && newValues) {
      changedFields = columns.filter(
        (c) => JSON.stringify(oldValues[c]) !== JSON.stringify(newValues[c]),
      );
      if (changedFields.length === 0) return; // no real change — skip noise
    }

    const store = auditContext.getStore();
    await appendAuditLog(manager, {
      category: 'DATA',
      action,
      tableName: metadata.tableName,
      recordId: this.resolveId(metadata, newEntity ?? oldEntity),
      oldValues,
      newValues,
      changedFields,
      realmId: store?.realmId ?? null,
      actorId: store?.actorId ?? null,
      actorUsername: store?.actorUsername ?? null,
    });
  }

  // JSON-safe snapshot: Dates -> ISO, undefined -> null, sensitive -> redacted
  private extract(columns: string[], entity: unknown): Record<string, unknown> {
    const source = entity as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const c of columns) {
      if (SENSITIVE_COLUMNS.has(c)) {
        out[c] = REDACTED;
        continue;
      }
      const v = source[c];
      if (v === undefined) out[c] = null;
      else if (v instanceof Date) out[c] = v.toISOString();
      else out[c] = v;
    }
    return out;
  }

  private resolveId(metadata: EntityMetadata, entity: unknown): string | null {
    if (!entity) return null;
    const pk = metadata.primaryColumns[0];
    if (!pk) return null;
    const value = (entity as Record<string, unknown>)[pk.propertyName];
    return value == null ? null : String(value);
  }
}
