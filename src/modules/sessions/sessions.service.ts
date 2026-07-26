import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { UserSession } from '../auth/entities/user-session.entity';
import { Realm } from '../realms/entities/realm.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(UserSession)
    private readonly sessionRepo: Repository<UserSession>,
    @InjectRepository(Realm)
    private readonly realmRepo: Repository<Realm>,
  ) {}

  /** Resolve the realm from its (globally-unique) name in the URL path. */
  private async resolveRealmId(realmName: string): Promise<string> {
    const realm = await this.realmRepo.findOne({ where: { realmName } });
    if (!realm) {
      throw new NotFoundException(`Realm '${realmName}' not found`);
    }
    return realm.id;
  }

  async findAllPaginated(
    realmName: string,
    page: number = 1,
    limit: number = 10,
    order: 'asc' | 'desc' | 'ASC' | 'DESC' = 'DESC',
    search?: string,
    isActive?: boolean,
  ): Promise<any> {
    const realmId = await this.resolveRealmId(realmName);
    const baseWhere: any = { realm: { id: realmId } };
    if (isActive !== undefined) {
      baseWhere.isActive = isActive;
    }

    const where = search?.trim()
      ? [
          { ...baseWhere, user: { username: Like(`%${search}%`) } },
          { ...baseWhere, user: { email: Like(`%${search}%`) } },
        ]
      : baseWhere;

    const [data, total] = await this.sessionRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: order.toUpperCase() as 'ASC' | 'DESC' },
      relations: ['user'],
    });
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** Marks a session inactive, signing the user out of every client in the realm. */
  async revoke(realmName: string, id: string): Promise<{ message: string }> {
    const realmId = await this.resolveRealmId(realmName);
    const session = await this.sessionRepo.findOne({
      where: { id, realm: { id: realmId } },
    });
    if (!session) {
      throw new NotFoundException(`Session ${id} not found in this realm`);
    }
    session.isActive = false;
    await this.sessionRepo.save(session);
    return { message: 'Session revoked successfully' };
  }
}
