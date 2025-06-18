import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';
import { AppLoggerService } from 'src/common/logger/logger.service';
import { Role } from '../roles/entities/role.entity';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly PermissionRepo: Repository<Permission>,
    private readonly roleService: RolesService,
    private readonly logger: AppLoggerService,
  ) {}
  async create(createPermissionDto: CreatePermissionDto): Promise<any> {
    try {
      const existing = await this.PermissionRepo.findOne({
        where: { name: createPermissionDto.name },
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
        } else {
          this.logger.error(
            `Attepmt to create dublicate permission : ${createPermissionDto.name}`,
            PermissionService.name,
          );
          throw new ConflictException(`Permission with this name ${createPermissionDto.name} already exists`);
        }
      }

      const newPermission = this.PermissionRepo.create(createPermissionDto);
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

  findAll() {
    return this.PermissionRepo.find({
      withDeleted: false,
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} permission`;
  }

  update(id: number, updatePermissionDto: UpdatePermissionDto) {
    return `This action updates a #${id} permission`;
  }

  remove(id: number) {
    return `This action removes a #${id} permission`;
  }

  async assignRoleToPermission(permissionId: number, roleIdList: number[]):Promise<any> {

    // Check is permissionId existed
    const permission: Permission = (await this.PermissionRepo.findOne({
      where: { id: permissionId },
      relations: ['roles'],
    })) as Permission;

    // If permission not existed
    if (!permission) {
      this.logger.warn(
        `Permission id ${permissionId} not found from database`,
        PermissionService.name,
      );
      throw new NotFoundException(`Permission with id ${permissionId} not found`);
    }

    // Get role list from role id list
    const rolesToAdd: Role[] = await this.roleService.findByIdList(roleIdList);

    const foundIds:number[] = rolesToAdd.map((r) => r.id );
    const missingIds:number[] = roleIdList.filter((id)=> !foundIds.includes(id));

    if (missingIds.length > 0) {
      this.logger.warn(
        `Role with id ${missingIds.toString()} not found`,
        PermissionService.name,
      );
      throw new BadRequestException(
        `Role not found for IDS: ${missingIds.join(', ')}`,
      );
    }

    permission.roles = [...permission.roles, ...rolesToAdd];
    await this.PermissionRepo.save(permission);
    this.logger.log(
      `Roles with id ${foundIds.toString()} assign successfully`,
      PermissionService.name,
    );

    return {
      message: 'Roles successfully assigned to the permission',
      permissionId: permission.id,
      assignedRoleIds: foundIds,
    };
  }

  async unassignRoleToPermission(permissionId: number, roleIdList: number[]):Promise<any> {

    // Check is permissionId existed
    const permission: Permission = (await this.PermissionRepo.findOne({
      where: { id: permissionId },
      relations: ['roles'],
    })) as Permission;

    // If permission not existed
    if (!permission) {
      this.logger.warn(
        `Permission id ${permissionId} not found from database`,
        PermissionService.name,
      );
      throw new NotFoundException(`Permission with id ${permissionId} not found`);
    }

    // Get role list from role id list
    const rolesToRemove: Role[] = await this.roleService.findByIdList(roleIdList);

    const foundIds:number[] = rolesToRemove.map((r) => r.id );
    const missingIds:number[] = roleIdList.filter((id)=> !foundIds.includes(id));

    if (missingIds.length > 0) {
      this.logger.warn(
        `Role with id ${missingIds.toString()} not found`,
        PermissionService.name,
      );
      throw new BadRequestException(
        `Role not found for IDS: ${missingIds.join(', ')}`,
      );
    }
    permission.roles = permission.roles.filter((role) => foundIds.indexOf(role.id));
    await this.PermissionRepo.save(permission);
    this.logger.log(
      `Roles with id ${foundIds.toString()} unassign successfully`,
      PermissionService.name,
    );

    return {
      message: 'Roles successfully unassigned to the permission',
      permissionId: permission.id,
      assignedRoleIds: foundIds,
    };
  }
}
