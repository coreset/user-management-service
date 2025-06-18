import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { In, Like, QueryFailedError, Repository, UpdateResult } from 'typeorm';
import { AppLoggerService } from 'src/common/logger/logger.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { PermissionService } from '../permission/permission.service';
import { Permission } from '../permission/entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly RoleRepo: Repository<Role>,
    private readonly logger: AppLoggerService,
    private readonly usersService: UsersService,
    private readonly permissionService: PermissionService,
  ) {}

  //async create(createRoleDto: CreateRoleDto): Promise<Role | null> {
  //  const role = this.RoleRepo.create(createRoleDto);
  //  try {
  //    const savedRole = await this.RoleRepo.save(role);
  //    return savedRole;
  //  } catch (error) {
  //    if (
  //      error instanceof QueryFailedError &&
  //      (error as any).errno === 1062 // MySQL duplicate entry
  //    ) {
  //      throw new ConflictException('Role already exists');
  //    }
  //    throw new InternalServerErrorException('Failed to create user');
  //  }
  //}

  async create(createRoleDto: CreateRoleDto): Promise<Role | null> {
    try {
      const existing = await this.RoleRepo.findOne({
        where: { name: createRoleDto.name },
        withDeleted: true, // so we also check soft-deleted ones
      });

      if (existing) {
        if (existing.deletedAt) {
          this.logger.warn(`Restoring soft-deleted user: ${createRoleDto.name}`, RolesService.name);
          // Restore the soft-deleted record
          await this.RoleRepo.restore(existing.id);

          // Optionally update other fields
          const updated = this.RoleRepo.merge(existing, createRoleDto);
          const restoredUser = await this.RoleRepo.save(updated);
          this.logger.log(`Role restored successfully: ${restoredUser.id}`, RolesService.name);
          return restoredUser;
        } else {
          this.logger.warn(`Attepmt to create dublicate user: ${createRoleDto.name}`, RolesService.name);
          throw new ConflictException(`User with this name ${createRoleDto.name} already exists`);
        }
      }

      // No conflict, proceed to create new
      const newUser = this.RoleRepo.create(createRoleDto);
      const savedUser = await this.RoleRepo.save(newUser);
      this.logger.log(`Role saved successfully: ${savedUser.id}`, RolesService.name);
      return savedUser;
    } catch (error) {
      // You can add custom error handling here
      this.logger.error(`Failed to create role: ${error.message}`, RolesService.name);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Something went wrong while creating the Role');
    }
  }

  // not use yet
  findAll() {
    return this.RoleRepo.find({
      withDeleted: false,
    });
  }

  async findAllPaginated(page: number, limit: number): Promise<any> {
    const [items, total] = await this.RoleRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      withDeleted: false,
    });

    return {
      data: items,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async searchAllPaginated(
    name: string,
    page: number,
    limit: number,
  ): Promise<any> {

    if (name && page && limit) {
      const [items, total] = await this.RoleRepo.findAndCount({
        //where: { name },
        where: { name: Like(`%${name}%`) },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: items,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };

    } else if (name && !page && !limit) {
      const item = await this.RoleRepo.find({
        where: { name },
      });
      return item;
    } else {
      throw new BadRequestException('Not found correct parameters to search,');
    }

  }

  findOne(id: number) {
    return `This action returns a #${id} role`;
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return `This action updates a #${id} role`;
  }

  //async softDelete(id: number): Promise<void> {
  //  const result: UpdateResult = await this.RoleRepo.softDelete(id);
  //  console.log("resule", result);
  //  if (result.affected === 0) {
  //    throw new NotFoundException(`User with id ${id} not found`);
  //  }
  //}

  async softDelete(id: number): Promise<void> {
    const role = await this.RoleRepo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!role) {
      this.logger.warn(`Role with id ${id} not found`, RolesService.name);
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    if (role.deletedAt) {
      this.logger.warn(`Role with id ${id} is already deleted`, RolesService.name);
      throw new ConflictException(`Role with id ${id} is already deleted`);
    }

    /* why need to check 'deletedAt' before 'restore' function
     * TypeORM's softDelete and restore do not check the current status
    * */
    await this.RoleRepo.softDelete(id);
    this.logger.warn(`Role with id ${id} successfully deleted`, RolesService.name);
  }

  //async restore(id: number): Promise<void> {
  //  const result: UpdateResult = await this.RoleRepo.restore(id);
  //  console.log("restore", result);
  //  if (result.affected === 0) {
  //    throw new NotFoundException(`Role with id: ${id} not fould or not deleted`)
  //  }
  //}

  async restore(id: number): Promise<void> {
    const role = await this.RoleRepo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!role) {
      this.logger.warn(`Role with id ${id} not found`, RolesService.name);
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    if (!role.deletedAt) {
      this.logger.warn(`Role with id ${id} is not deleted`, RolesService.name);
      throw new ConflictException(`Role with id ${id} is not deleted`);
    }

    /* why need to check 'deletedAt' before 'restore' function
     * TypeORM's softDelete and restore do not check the current status
    * */
    await this.RoleRepo.restore(id);
    this.logger.log(`Role with id ${id} successfully restored`, RolesService.name);
  }

  findByIdList(idList: number[]): Promise<any> {
    return this.RoleRepo.find({
      where: {id : In(idList)}
    });
  }

  async assignUsersToRole(roleId: number, userIdList: number[]) {
    const role: Role = (await this.RoleRepo.findOne({
      where: { id: roleId },
      relations: ['users'],
    })) as Role;

    if (!role) {
      this.logger.warn(
        `Role id ${roleId} not found from the database`,
        RolesService.name,
      );
      throw new NotFoundException(`Role with id ${roleId} not found`);
    }

    const usersToAdd: User[] = await this.usersService.findByIdList(userIdList);

    const foundIds: number[] = usersToAdd.map((u) => u.id);
    const missingIds = userIdList.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      this.logger.warn(
        `Users with id ${missingIds.toString()} not found`,
        RolesService.name,
      );
      throw new BadRequestException(
        `Users not found for IDs: ${missingIds.join(', ')}`,
      );
    }

    role.users = [...role.users, ...usersToAdd]; // merge usersToAdd
    await this.RoleRepo.save(role);
    this.logger.log(
      `Users with id ${foundIds.toString()} assign successfully`,
      RolesService.name,
    );

    return {
      message: 'Users successfully assigned to the role',
      roleId: role.id,
      assignedUserIds: foundIds,
    };
  }

  async assignPermissionsToRole(roleId: number, permissionIdList: number[]) {
    const role: Role = (await this.RoleRepo.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    })) as Role;

    if (!role) {
      this.logger.warn(
        `Role id ${roleId} not found from the database`,
        RolesService.name,
      );
      throw new NotFoundException(`Role with id ${roleId} not found`);
    }

    const permissionsToAdd: Permission[] = await this.permissionService.findByIdList(permissionIdList);

    const foundIds: number[] = permissionsToAdd.map((u) => u.id);
    const missingIds = permissionIdList.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      this.logger.warn(
        `Permissions with id ${missingIds.toString()} not found`,
        RolesService.name,
      );
      throw new BadRequestException(
        `Permissions not found for IDs: ${missingIds.join(', ')}`,
      );
    }

    role.permissions = [...role.permissions, ...permissionsToAdd]; // merge permissionsToAdd
    await this.RoleRepo.save(role);
    this.logger.log(
      `Permissions with id ${foundIds.toString()} assign successfully`,
      RolesService.name,
    );

    return {
      message: 'Permissions successfully assigned to the role',
      roleId: role.id,
      assignedPermissionIds: foundIds,
    };
  }

  async unassignUsersFromRole(roleId: number, userIdList: number[]) {
    const role: Role = (await this.RoleRepo.findOne({
      where: { id: roleId },
      relations: ['users'],
    })) as Role;

    if (!role) {
      this.logger.warn(
        `Role id ${roleId} not found from the database`,
        RolesService.name,
      );
      throw new NotFoundException(`Role with id ${roleId} not found`);
    }

    const usersToRemove: User[] = await this.usersService.findByIdList(userIdList);

    const foundIds: number[] = usersToRemove.map((u) => u.id);
    const missingIds = userIdList.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      this.logger.warn(
        `Users with id ${missingIds.toString()} not found`,
        RolesService.name,
      );
      throw new BadRequestException(
        `Users not found for IDs: ${missingIds.join(', ')}`,
      );
    }

    // Filter out users to be removed
    role.users = role.users.filter((user) => !foundIds.includes(user.id));

    await this.RoleRepo.save(role);

    this.logger.log(
      `Users with id ${foundIds.toString()} unassigned successfully from role ${roleId}`,
      RolesService.name,
    );

    return {
      message: 'Users successfully unassigned from the role',
      roleId: role.id,
      unassignedUserIds: foundIds,
    };
  }

  async unassignPermissionsFromRole(roleId: number, permissionIdList: number[]) {
    const role: Role = (await this.RoleRepo.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    })) as Role;

    if (!role) {
      this.logger.warn(
        `Role id ${roleId} not found from the database`,
        RolesService.name,
      );
      throw new NotFoundException(`Role with id ${roleId} not found`);
    }

    const permissionsToRemove: User[] = await this.permissionService.findByIdList(permissionIdList);

    const foundIds: number[] = permissionsToRemove.map((u) => u.id);
    const missingIds = permissionIdList.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      this.logger.warn(
        `Permissions with id ${missingIds.toString()} not found`,
        RolesService.name,
      );
      throw new BadRequestException(
        `Permissions not found for IDs: ${missingIds.join(', ')}`,
      );
    }

    // Filter out permissions to be removed
    role.permissions = role.permissions.filter((permission) => !foundIds.includes(permission.id));

    await this.RoleRepo.save(role);

    this.logger.log(
      `Permissions with id ${foundIds.toString()} unassigned successfully from role ${roleId}`,
      RolesService.name,
    );

    return {
      message: 'Permission(s) successfully unassigned from the role',
      roleId: role.id,
      unassignedPermissionIds: foundIds,
    };
  }
}
