import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';
import { Realm } from '../realms/entities/realm.entity';
import { AppLoggerService } from '../../common/logger/logger.service';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Realm)
    private readonly realmRepo: Repository<Realm>,
    private readonly logger: AppLoggerService,
  ) {}

  /** Resolve the realm from its (globally-unique) name in the URL path. */
  async resolveRealmId(realmName: string): Promise<string> {
    const realm = await this.realmRepo.findOne({ where: { realmName } });
    if (!realm) {
      throw new NotFoundException(`Realm '${realmName}' not found`);
    }
    return realm.id;
  }

  // ----- Clients -------------------------------------------------------------

  async create(realmId: string, dto: CreateClientDto): Promise<Client> {
    const existing = await this.clientRepo.findOne({
      where: { clientId: dto.clientId, realm: { id: realmId } },
      relations: ['realm'],
    });
    if (existing) {
      throw new ConflictException(
        `Client '${dto.clientId}' already exists in this realm`,
      );
    }

    const isPublic = dto.publicClient ?? false;
    const client = this.clientRepo.create({
      realm: { id: realmId } as Realm,
      name: dto.name,
      clientId: dto.clientId,
      // Only confidential clients get a secret.
      clientSecret: isPublic ? null : randomBytes(32).toString('hex'),
      publicClient: isPublic,
      redirectUris: dto.redirectUris ?? '',
      grantTypes: dto.grantTypes ?? '',
      isActive: dto.isActive ?? true,
    });

    const saved = await this.clientRepo.save(client);
    this.logger.log(
      `Client '${saved.clientId}' created in realm ${realmId}`,
      ClientsService.name,
    );
    return saved;
  }

  findAll(realmId: string): Promise<Client[]> {
    return this.clientRepo.find({ where: { realm: { id: realmId } } });
  }

  async findAllPaginated(
    realmId: string,
    page: number = 1,
    limit: number = 10,
    order: 'asc' | 'desc' | 'ASC' | 'DESC' = 'DESC',
    search?: string,
    isActive?: boolean,
  ): Promise<any> {
    const baseWhere: any = { realm: { id: realmId } };
    if (isActive !== undefined) {
      baseWhere.isActive = isActive;
    }

    // Search by client name or clientId (OR across the two fields, each
    // branch still AND-ed with the realm/isActive filters above).
    const where = search?.trim()
      ? [
          { ...baseWhere, name: Like(`%${search}%`) },
          { ...baseWhere, clientId: Like(`%${search}%`) },
        ]
      : baseWhere;

    const [data, total] = await this.clientRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: order.toUpperCase() as 'ASC' | 'DESC' },
      relations: ['realm'],
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

  async findOne(realmId: string, id: string): Promise<Client> {
    const client = await this.clientRepo.findOne({
      where: { id, realm: { id: realmId } },
    });
    if (!client) {
      throw new NotFoundException(`Client with id ${id} not found in this realm`);
    }
    return client;
  }

  async update(
    realmId: string,
    id: string,
    dto: UpdateClientDto,
  ): Promise<Client> {
    const client = await this.findOne(realmId, id);
    Object.assign(client, {
      name: dto.name ?? client.name,
      clientId: dto.clientId ?? client.clientId,
      publicClient: dto.publicClient ?? client.publicClient,
      redirectUris: dto.redirectUris ?? client.redirectUris,
      grantTypes: dto.grantTypes ?? client.grantTypes,
      isActive: dto.isActive ?? client.isActive,
    });
    return this.clientRepo.save(client);
  }

  async remove(realmId: string, id: string): Promise<{ message: string }> {
    const client = await this.findOne(realmId, id);
    await this.clientRepo.remove(client);
    return { message: 'Client deleted successfully' };
  }
}
