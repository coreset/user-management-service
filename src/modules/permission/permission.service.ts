import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Realm } from '../realms/entities/realm.entity';
import { In, Repository } from 'typeorm';
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

  async findAllPaginated(
    realmName: string,
    page: number = 1,
    limit: number = 10,
    order: 'asc' | 'desc' | 'ASC' | 'DESC' = 'DESC',
  ): Promise<any> {
    const realmId = await this.resolveRealmId(realmName);
    const [data, total] = await this.PermissionRepo.findAndCount({
      where: { realm: { id: realmId } },
      skip: (page - 1) * limit,
      take: limit,
      order: { id: order.toUpperCase() as 'ASC' | 'DESC' },
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

  findOne(id: string) {
    return `This action returns a #${id} permission`;
  }

  update(id: string, updatePermissionDto: UpdatePermissionDto) {
    return `This action updates a #${id} permission`;
  }

  remove(id: string) {
    return `This action removes a #${id} permission`;
  }

  /** Loads permissions by id, restricted to the given realm. */
  findByIdList(realmId: string, idList: string[]): Promise<Permission[]> {
    return this.PermissionRepo.find({
      where: { id: In(idList), realm: { id: realmId } },
    });
  }
}
