import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Carries the current actor across the async call chain so the TypeORM
 * subscriber (which is not request-scoped) can attribute changes to a user.
 */
export interface AuditStore {
  actorId?: string;
  actorUsername?: string;
  realmId?: string;
}

export const auditContext = new AsyncLocalStorage<AuditStore>();
