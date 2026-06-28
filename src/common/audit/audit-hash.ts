import { createHash } from 'node:crypto';

/**
 * Deterministic JSON: keys sorted recursively and Dates as ISO strings, so the
 * hash is identical at write-time and verify-time even though MySQL's JSON type
 * may reorder object keys on read-back.
 */
export function stableStringify(value: unknown): string {
  if (value === undefined || value === null) return 'null';
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}'
  );
}

/** Canonical, fully-populated payload that gets hashed. All keys always present. */
export interface HashPayload {
  category: string;
  action: string;
  tableName: string | null;
  recordId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedFields: string[] | null;
  status: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  realmId: string | null;
  actorId: string | null;
  actorUsername: string | null;
}

export function computeRowHash(
  prevHash: string | null | undefined,
  payload: HashPayload,
): string {
  return createHash('sha256')
    .update((prevHash ?? '') + stableStringify(payload))
    .digest('hex');
}
