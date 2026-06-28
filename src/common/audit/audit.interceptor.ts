import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { auditContext, AuditStore } from './audit-context';

/**
 * Runs each request inside an AsyncLocalStorage scope carrying the authenticated
 * actor, so the (non-request-scoped) AuditSubscriber can attribute every DB
 * change to whoever made it. Registered globally via APP_INTERCEPTOR.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<{ user?: { id?: unknown; realmId?: string; username?: string } }>();
    const user = req?.user;
    const store: AuditStore = {
      actorId: user?.id != null ? String(user.id) : undefined,
      realmId: user?.realmId,
      actorUsername: user?.username,
    };

    return new Observable((observer) => {
      auditContext.run(store, () => {
        next.handle().subscribe({
          next: (v) => observer.next(v),
          error: (e) => observer.error(e),
          complete: () => observer.complete(),
        });
      });
    });
  }
}
