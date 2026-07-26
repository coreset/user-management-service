import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { CreateClientRoleDto } from '../dto/create-client-role.dto';
import { ClientRole } from '../../clients/entities/client-role.entity';
import { UserClientRole } from '../../clients/entities/user-client-role.entity';
import { Realm } from '../../realms/entities/realm.entity';
import { User } from '../../users/entities/user.entity';
import { Permission } from '../../permission/entities/permission.entity';
import { ClientsService } from '../../clients/clients.service';
import { UsersService } from '../../users/users.service';

/**
 * Owns client-role logic: roles defined per client, their assignment to users
 * (via user_client_roles), and their granted permissions (client_role_permissions).
 * Client lookup/validation is delegated to ClientsService.
 */
@Injectable()
export class ClientRolesService {
  constructor(
    @InjectRepository(ClientRole)
    private readonly clientRoleRepo: Repository<ClientRole>,
    @InjectRepository(UserClientRole)
    private readonly userClientRoleRepo: Repository<UserClientRole>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    private readonly clientsService: ClientsService,
    private readonly usersService: UsersService,
  ) {}

  // ----- Client roles --------------------------------------------------------

  async createClientRole(
    realmId: string,
    clientId: string,
    dto: CreateClientRoleDto,
  ): Promise<ClientRole> {
    const client = await this.clientsService.findOne(realmId, clientId);

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
    const client = await this.clientsService.findOne(realmId, clientId);
    return this.clientRoleRepo.find({ where: { client: { id: client.id } } });
  }

  /** Total client-role count across every client in a realm (used by the dashboard). */
  countByRealm(realmId: string): Promise<number> {
    return this.clientRoleRepo.count({ where: { realm: { id: realmId } } });
  }

  async findAllPaginated(
    realmId: string,
    clientId: string,
    page: number = 1,
    limit: number = 10,
    order: 'asc' | 'desc' | 'ASC' | 'DESC' = 'DESC',
    search?: string,
  ): Promise<any> {
    const client = await this.clientsService.findOne(realmId, clientId);
    const where = search?.trim()
      ? { client: { id: client.id }, name: Like(`%${search}%`) } // load client-roles for selected client with filer by role name
      : { client: { id: client.id } }; // load client-roles for selected client.

    const [data, total] = await this.clientRoleRepo.findAndCount({
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
    const client = await this.clientsService.findOne(realmId, clientId);

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

  // return users for given client's role in it own relam
  async listClientRoleUsers(
    realmId: string,
    clientId: string,
    clientRoleId: string,
  ): Promise<User[]> {
    const client = await this.clientsService.findOne(realmId, clientId);
    const clientRole = await this.clientRoleRepo.findOne({
      where: { id: clientRoleId, client: { id: client.id } },
    });
    if (!clientRole) {
      throw new NotFoundException(
        `Client role ${clientRoleId} not found on this client`,
      );
    }

    const assignments = await this.userClientRoleRepo.find({
      where: { clientRole: { id: clientRoleId } },
      relations: ['user'],
    });
    return assignments.map((assignment) => assignment.user);
  }

  /** Lists the client roles (across all clients) currently assigned to a given user. */
  /** Lists the client roles currently assigned to a given user, for this client. */
  async findRolesForUser(
    realmId: string,
    clientId: string,
    userId: string,
  ): Promise<UserClientRole[]> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    const client = await this.clientsService.findOne(realmId, clientId);
    return this.userClientRoleRepo.find({
      where: { user: { id: userId }, client: { id: client.id } },
      relations: ['clientRole', 'clientRole.realm', 'client'],
    });
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

  // ----- Client role <-> permission assignment ------------------------------

  private async getClientRoleWithPermissions(
    realmId: string,
    clientId: string,
    clientRoleId: string,
  ): Promise<ClientRole> {
    const client = await this.clientsService.findOne(realmId, clientId);
    const clientRole = await this.clientRoleRepo.findOne({
      where: { id: clientRoleId, client: { id: client.id } },
      relations: ['permissions'],
    });
    if (!clientRole) {
      throw new NotFoundException(
        `Client role ${clientRoleId} not found on this client`,
      );
    }
    return clientRole;
  }

  async addPermissionsToClientRole(
    realmId: string,
    clientId: string,
    clientRoleId: string,
    permissionIds: string[],
  ): Promise<ClientRole> {
    const clientRole = await this.getClientRoleWithPermissions(
      realmId,
      clientId,
      clientRoleId,
    );

    // Restricted to the client's realm (prevents attaching another realm's
    // permissions to this client role).
    const permissions = await this.permissionRepo.find({
      where: { id: In(permissionIds), realm: { id: realmId } },
    });
    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions not found in this realm');
    }

    const existingIds = new Set(clientRole.permissions.map((p) => p.id));
    for (const permission of permissions) {
      if (!existingIds.has(permission.id)) {
        clientRole.permissions.push(permission);
      }
    }
    return this.clientRoleRepo.save(clientRole);
  }

  async listClientRolePermissions(
    realmId: string,
    clientId: string,
    clientRoleId: string,
  ): Promise<Permission[]> {
    const clientRole = await this.getClientRoleWithPermissions(
      realmId,
      clientId,
      clientRoleId,
    );
    return clientRole.permissions;
  }

  async removePermissionFromClientRole(
    realmId: string,
    clientId: string,
    clientRoleId: string,
    permissionId: string,
  ): Promise<{ message: string }> {
    const clientRole = await this.getClientRoleWithPermissions(
      realmId,
      clientId,
      clientRoleId,
    );
    clientRole.permissions = clientRole.permissions.filter(
      (p) => p.id !== permissionId,
    );
    await this.clientRoleRepo.save(clientRole);
    return { message: 'Permission removed from client role' };
  }
}
