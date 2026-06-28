import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { computeRowHash } from './audit-hash';
import { appendAuditLog } from './audit-writer';

export type AuthEventInput = {
  action: string; // USER_LOGIN | USER_LOGIN_FAILED | USER_LOGOUT | PASSWORD_CHANGE | ...
  status?: 'SUCCESS' | 'FAILURE';
  actorId?: string | null;
  actorUsername?: string | null;
  realmId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
  ) {}

  /** Append an AUTH event (login/logout/password-change). Never throws into the caller. */
  async recordAuthEvent(input: AuthEventInput): Promise<void> {
    try {
      await appendAuditLog(this.auditLogRepo.manager, {
        category: 'AUTH',
        ...input,
      });
    } catch {
      // auditing must never break the auth flow
    }
  }

  async findAuditLogs(query: AuditLogQueryDto) {
    const { page, limit, sortBy, order, category, action, tableName, recordId, actorId } =
      query;
    const where: FindOptionsWhere<AuditLog> = {};
    if (category) where.category = category;
    if (action) where.action = action;
    if (tableName) where.tableName = tableName;
    if (recordId) where.recordId = recordId;
    if (actorId) where.actorId = actorId;

    const [data, total] = await this.auditLogRepo.findAndCount({
      where,
      order: { [sortBy]: order.toUpperCase() as 'ASC' | 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<AuditLog> {
    const entity = await this.auditLogRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`AuditLog ${id} not found`);
    return entity;
  }

  /**
   * Walks the whole chain recomputing each hash; reports the first row whose
   * stored hash doesn't match — evidence of tampering or a deleted row.
   */
  async verifyChain(): Promise<{ valid: boolean; checked: number; brokenAt?: string }> {
    const rows = await this.auditLogRepo.find({
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    let prevHash: string | null = null;
    for (const row of rows) {
      const expected = computeRowHash(prevHash, {
        category: row.category,
        action: row.action,
        tableName: row.tableName ?? null,
        recordId: row.recordId ?? null,
        oldValues: row.oldValues ?? null,
        newValues: row.newValues ?? null,
        changedFields: row.changedFields ?? null,
        status: row.status ?? null,
        ipAddress: row.ipAddress ?? null,
        userAgent: row.userAgent ?? null,
        realmId: row.realmId ?? null,
        actorId: row.actorId ?? null,
        actorUsername: row.actorUsername ?? null,
      });
      if (expected !== row.rowHash || (row.prevHash ?? null) !== prevHash) {
        return { valid: false, checked: rows.length, brokenAt: row.id };
      }
      prevHash = row.rowHash;
    }
    return { valid: true, checked: rows.length };
  }
}
