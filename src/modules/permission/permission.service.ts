import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Realm } from '../realms/entities/realm.entity';
import { In, Like, Repository } from 'typeorm';
import { AppLoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly PermissionRepo: Repository<Permission>,
    @InjectRepository(Realm)
    private readonly realmRepo: Repository<Realm>,
    private readonly logger: AppLoggerService,
  ) {}

  /** Resolves a realm by its (globally-unique) name; null if not found. */
  findByName(realmName: string): Promise<Realm | null> {
    return this.realmRepo.findOne({ where: { realmName } });
  }

  /** Resolve the realm from its name in the URL path (throws if not found). */
  private async resolveRealmId(realmName: string): Promise<string> {
    const realm = await this.findByName(realmName);
    if (!realm) {
      throw new NotFoundException(`Realm '${realmName}' not found`);
    }
    return realm.id;
  }

  async create(
    realmName: string,
    createPermissionDto: CreatePermissionDto,
  ): Promise<any> {
    const realmId = await this.resolveRealmId(realmName);
    try {
      // Uniqueness is per realm (UNIQUE(realm_id, name)).
      const existing = await this.PermissionRepo.findOne({
        where: { name: createPermissionDto.name, realm: { id: realmId } },
        withDeleted: true,
      });

      if (existing) {
        if (existing.deletedAt) {
          this.logger.warn(`Restoring soft-deleted Permission ${createPermissionDto.name}`, PermissionService.name);
          // Restoring the soft-deleted record
          await this.PermissionRepo.restore(existing.id);

          // Optionally update other fields
          const updated = this.PermissionRepo.merge(existing, createPermissionDto);
          const restoredPermission = await this.PermissionRepo.save(updated);
          this.logger.log(`Permission restored successfully: ${restoredPermission.id}`, PermissionService.name);
          return restoredPermission;
        } else {
          this.logger.error(
            `Attepmt to create dublicate permission : ${createPermissionDto.name}`,
            PermissionService.name,
          );
          throw new ConflictException(`Permission with this name ${createPermissionDto.name} already exists in this realm`);
        }
      }

      const newPermission = this.PermissionRepo.create({
        name: createPermissionDto.name,
        realm: { id: realmId } as Realm,
      });
      const savedPermission = await this.PermissionRepo.save(newPermission);
      this.logger.log(`Permission saved successfully: ${savedPermission.id}`, PermissionService.name);
      return savedPermission;
    } catch (error) {
      this.logger.error(`Failed to create Permission: ${error.message}`, PermissionService.name);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Something went wrong while creating the Permission');
    }
  }

  async findAll(realmName: string) {
    const realmId = await this.resolveRealmId(realmName);
    return this.PermissionRepo.find({
      where: { realm: { id: realmId } },
      withDeleted: false,
    });
  }

  /** Total permission-catalog count for a realm (used by the dashboard). */
  countByRealm(realmId: string): Promise<number> {
    return this.PermissionRepo.count({ where: { realm: { id: realmId } } });
  }

  async findAllPaginated(
    realmName: string,
    page: number = 1,
    limit: number = 10,
    order: 'asc' | 'desc' | 'ASC' | 'DESC' = 'DESC',
    search?: string,
  ): Promise<any> {
    const realmId = await this.resolveRealmId(realmName);
    const baseWhere: any = { realm: { id: realmId } };
    const where = search?.trim()
      ? { ...baseWhere, name: Like(`%${search}%`) }
      : baseWhere;

    const [data, total] = await this.PermissionRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { id: order.toUpperCase() as 'ASC' | 'DESC' },
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

  async findOne(realmName: string, id: string): Promise<Permission> {
    const realmId = await this.resolveRealmId(realmName);
    const permission = await this.PermissionRepo.findOne({
      where: { id, realm: { id: realmId } },
    });
    if (!permission) {
      throw new NotFoundException(`Permission with id ${id} not found in this realm`);
    }
    return permission;
  }

  async update(
    realmName: string,
    id: string,
    updatePermissionDto: UpdatePermissionDto, // update name only
  ): Promise<Permission> {
    const permission = await this.findOne(realmName, id);
    if (permission.isSystem) {
      throw new ForbiddenException('System permissions cannot be renamed');
    }
    Object.assign(permission, updatePermissionDto);
    return this.PermissionRepo.save(permission);
  }

  async remove(realmName: string, id: string): Promise<{ message: string }> {
    const realmId = await this.resolveRealmId(realmName);
    const permission = await this.PermissionRepo.findOne({
      where: { id, realm: { id: realmId } },
      relations: ['realmRoles', 'clientRoles'],
    });
    if (!permission) {
      throw new NotFoundException(`Permission with id ${id} not found in this realm`);
    }
    if (permission.isSystem) {
      throw new ForbiddenException('System permissions cannot be deleted');
    }
    if (permission.realmRoles.length > 0 || permission.clientRoles.length > 0) {
      throw new ConflictException(
        'Permission is currently assigned to one or more roles; unassign it first',
      );
    }
    await this.PermissionRepo.softDelete(id);
    return { message: 'Permission deleted successfully' };
  }

  /** Loads permissions by id, restricted to the given realm. */
  findByIdList(realmId: string, idList: string[]): Promise<Permission[]> {
    return this.PermissionRepo.find({
      where: { id: In(idList), realm: { id: realmId } },
    });
  }
}
