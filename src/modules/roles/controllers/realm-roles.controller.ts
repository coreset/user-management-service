import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { RealmRolesService } from '../services/realm-roles.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RoleResponseDto } from '../dto/role-response.dto';
import { RolePaginatedResponseDto } from '../dto/role-paginated-response.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../../permission/decorators/permissions.decorator';
import { PermissionKey } from '../../permission/constants/permission-key.enum';
import { RoleQueryDto } from '../dto/role-query.dto';
import { AssignUsersDto } from '../dto/assign-users.dto';
import { AssignPermissionsDto } from '../dto/assign-permissions.dto';
import { RealmsService } from '../../realms/realms.service';

const ID_PARAM = {
  name: 'id',
  required: true,
  format: 'uuid',
  description: 'UUID of the realm role',
} as const;

const ROLE_ID_PARAM = {
  name: 'roleId',
  required: true,
  format: 'uuid',
  description: 'UUID of the realm role',
} as const;

@ApiTags('Realm Roles')
@Controller('realms/:realmName/roles')
@ApiBearerAuth('authorization') // for add authrization header with swagger
@ApiParam({
  name: 'realmName',
  required: true,
  example: 'master',
  description: 'Name of the realm the roles belong to',
})
export class RealmRolesController {
  constructor(
    private readonly realmRolesService: RealmRolesService,
    private readonly realmsService: RealmsService,
  ) {}

  /** Resolve the realm from its (globally-unique) name in the URL path. */
  private async resolveRealmId(realmName: string): Promise<string> {
    const realm = await this.realmsService.findByName(realmName);
    if (!realm) {
      throw new NotFoundException(`Realm '${realmName}' not found`);
    }
    return realm.id;
  }

  @Permissions([PermissionKey.ROLES_CREATE])
  @Post()
  @ApiOperation({
    summary: 'Create a realm role',
    description: 'Creates a new role scoped to the given realm (or restores it if it was previously soft-deleted).',
  })
  @ApiResponse({ status: 201, description: 'Role created (or restored from a soft-deleted state).' })
  @ApiResponse({ status: 404, description: "Realm 'realmName' not found." })
  @ApiResponse({ status: 409, description: 'A role with this name already exists in this realm.' })
  async create(
    @Param('realmName') realmName: string,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    // Realm roles are scoped to the realm named in the path.
    const realmId = await this.resolveRealmId(realmName);
    const result = await this.realmRolesService.create(createRoleDto, realmId);
    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  // GET /realms/:realmName/roles — plain list, or filtered with ?name=...
  @Permissions([PermissionKey.ROLES_READ])
  @Get()
  @ApiOperation({
    summary: 'List realm roles',
    description: 'Lists roles, paginated, optionally filtered by a name substring.',
  })
  @ApiQuery({ name: 'name', required: false, example: 'ADMIN', description: 'Substring filter on role name' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (1-indexed)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Page size' })
  @ApiResponse({ status: 200, description: 'Paginated list of roles.' })
  async findAll(@Query() query: RoleQueryDto) {
    const result = await this.realmRolesService.findAllPaginated(query.page, query.limit, query.name);
    return plainToInstance(RolePaginatedResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.ROLES_READ])
  @Get(':id')
  @ApiOperation({ summary: 'Get a realm role by id' })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'The requested role.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = this.realmRolesService.findOne(id);
    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.ROLES_UPDATE])
  @Patch(':id')
  @ApiOperation({ summary: 'Update a realm role' })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'Role updated.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const result = this.realmRolesService.update(id, updateRoleDto);
    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.ROLES_DELETE])
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a realm role',
    description: 'Soft-deletes a role. SUPER_ADMIN cannot be deleted.',
  })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'Role soft-deleted.' })
  @ApiResponse({ status: 403, description: 'The SUPER_ADMIN role cannot be deleted.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @ApiResponse({ status: 409, description: 'Role is already deleted.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.realmRolesService.softDelete(id);
  }

  @Permissions([PermissionKey.ROLES_DELETE])
  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted realm role',
  })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 201, description: 'Role restored.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @ApiResponse({ status: 409, description: 'Role is not deleted.' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.realmRolesService.restore(id);
  }

  // ----- Role <-> Users (nested sub-resource) --------------------------------
  @Permissions([PermissionKey.ROLES_ASSIGN_USERS])
  @Post(':roleId/users')
  @ApiOperation({
    summary: 'Assign users to a realm role',
    description: 'Assigns one or more users (scoped to the role\'s own realm) to an existing realm role.',
  })
  @ApiParam(ROLE_ID_PARAM)
  @ApiResponse({ status: 201, description: 'Users assigned to the role.' })
  @ApiResponse({ status: 400, description: 'One or more user IDs not found in this realm.' })
  @ApiResponse({ status: 403, description: 'Cannot assign users to the SUPER_ADMIN role.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  addUsers(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    return this.realmRolesService.assignUsersToRole(roleId, assignUsersDto.userIdList);
  }

  @Permissions([PermissionKey.ROLES_ASSIGN_USERS])
  @Delete(':roleId/users/:userId')
  @ApiOperation({ summary: 'Unassign a user from a realm role' })
  @ApiParam(ROLE_ID_PARAM)
  @ApiParam({ name: 'userId', required: true, format: 'uuid', description: 'UUID of the user to unassign' })
  @ApiResponse({ status: 200, description: 'User unassigned from the role.' })
  @ApiResponse({ status: 400, description: 'User ID not found.' })
  @ApiResponse({ status: 403, description: 'Cannot unassign users from the SUPER_ADMIN role.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  removeUser(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.realmRolesService.unassignUsersFromRole(roleId, [userId]);
  }

  // ----- Role <-> Permissions (nested sub-resource) --------------------------
  // ROLES_ASSIGN_PERMISSIONS is deliberately SUPER_ADMIN-only — see the enum's
  // doc comment for the privilege-escalation risk of granting it to REALM_ADMIN.
  @Permissions([PermissionKey.ROLES_ASSIGN_PERMISSIONS])
  @Post(':roleId/permissions')
  @ApiOperation({
    summary: 'Assign permissions to a realm role',
    description: 'Assigns one or more permissions to an existing realm role. Only users with SUPER_ADMIN permission can perform this operation due to privilege escalation risks.',
  })
  @ApiParam({
    name: 'roleId',
    required: true,
    type: 'string',
    format: 'uuid',
    description: 'UUID of the realm role to assign permissions to',
  })
  @ApiResponse({ status: 201, description: 'Permissions assigned to the role.' })
  @ApiResponse({ status: 400, description: 'Target role is SUPER_ADMIN, or one or more permission IDs not found in this realm.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  addPermissions(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.realmRolesService.assignPermissionsToRole(roleId, assignPermissionsDto.permissionIds);
  }
  @Permissions([PermissionKey.ROLES_ASSIGN_PERMISSIONS])
  @Delete(':roleId/permissions/:permissionId')
  @ApiOperation({ summary: 'Remove a permission from a realm role' })
  @ApiParam(ROLE_ID_PARAM)
  @ApiParam({ name: 'permissionId', required: true, format: 'uuid', description: 'UUID of the permission to remove' })
  @ApiResponse({ status: 200, description: 'Permission removed from the role.' })
  @ApiResponse({ status: 400, description: 'Permission ID not found in this realm.' })
  @ApiResponse({ status: 403, description: "Cannot change the SUPER_ADMIN role's permissions." })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  removePermission(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ) {
    return this.realmRolesService.unassignPermissionsFromRole(roleId, [permissionId]);
  }
}
