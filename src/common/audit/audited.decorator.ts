/**
 * Class decorator to opt an entity into row-level audit logging.
 * Only entities marked @Audited() are captured by the AuditSubscriber.
 */
const AUDITED_ENTITIES = new Set<Function>();

export function Audited(): ClassDecorator {
  return (target) => {
    AUDITED_ENTITIES.add(target);
  };
}

export function isAudited(target: unknown): boolean {
  return typeof target === 'function' && AUDITED_ENTITIES.has(target);
}
