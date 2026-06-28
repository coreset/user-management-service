import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateClientRoleDto } from './dto/create-client-role.dto';
import { Client } from './entities/client.entity';
import { ClientRole } from './entities/client-role.entity';
import { UserClientRole } from './entities/user-client-role.entity';
import { Realm } from '../realms/entities/realm.entity';
import { User } from '../users/entities/user.entity';
import { AppLoggerService } from '../../common/logger/logger.service';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(ClientRole)
    private readonly clientRoleRepo: Repository<ClientRole>,
    @InjectRepository(UserClientRole)
    private readonly userClientRoleRepo: Repository<UserClientRole>,
    private readonly logger: AppLoggerService,
  ) {}

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
      enabled: dto.enabled ?? true,
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
      enabled: dto.enabled ?? client.enabled,
    });
    return this.clientRepo.save(client);
  }

  async remove(realmId: string, id: string): Promise<{ message: string }> {
    const client = await this.findOne(realmId, id);
    await this.clientRepo.remove(client);
    return { message: 'Client deleted successfully' };
  }

  // ----- Client roles --------------------------------------------------------

  async createClientRole(
    realmId: string,
    clientId: string,
    dto: CreateClientRoleDto,
  ): Promise<ClientRole> {
    const client = await this.findOne(realmId, clientId);

    const existing = await this.clientRoleRepo.findOne({
      where: { client: { id: client.id }, name: dto.name },
      withDeleted: true,
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictException(
        `Client role '${dto.name}' already exists on this client`,
      );
    }

    const clientRole = this.clientRoleRepo.create({
      realm: { id: realmId } as Realm,
      client,
      name: dto.name,
      description: dto.description,
    });
    return this.clientRoleRepo.save(clientRole);
  }

  async listClientRoles(realmId: string, clientId: string): Promise<ClientRole[]> {
    const client = await this.findOne(realmId, clientId);
    return this.clientRoleRepo.find({ where: { client: { id: client.id } } });
  }

  async deleteClientRole(clientRoleId: string): Promise<{ message: string }> {
    const result = await this.clientRoleRepo.softDelete(clientRoleId);
    if (result.affected === 0) {
      throw new NotFoundException(`Client role ${clientRoleId} not found`);
    }
    return { message: 'Client role deleted successfully' };
  }

  // ----- User <-> client role assignment ------------------------------------

  async assignClientRoleToUser(
    realmId: string,
    clientId: string,
    userId: string,
    clientRoleId: string,
  ): Promise<UserClientRole> {
    const client = await this.findOne(realmId, clientId);

    const clientRole = await this.clientRoleRepo.findOne({
      where: { id: clientRoleId, client: { id: client.id } },
    });
    if (!clientRole) {
      throw new NotFoundException(
        `Client role ${clientRoleId} not found on this client`,
      );
    }

    const existing = await this.userClientRoleRepo.findOne({
      where: {
        user: { id: userId },
        clientRole: { id: clientRoleId },
      },
    });
    if (existing) {
      throw new ConflictException('User already has this client role');
    }

    const assignment = this.userClientRoleRepo.create({
      user: { id: userId } as User,
      client,
      clientRole,
    });
    return this.userClientRoleRepo.save(assignment);
  }

  async unassignClientRoleFromUser(
    userId: string,
    clientRoleId: string,
  ): Promise<{ message: string }> {
    const result = await this.userClientRoleRepo.delete({
      user: { id: userId },
      clientRole: { id: clientRoleId },
    });
    if (result.affected === 0) {
      throw new NotFoundException('Assignment not found');
    }
    return { message: 'Client role unassigned from user' };
  }
}
