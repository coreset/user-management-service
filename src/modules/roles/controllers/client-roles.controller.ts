import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ClientRolesService } from '../services/client-roles.service';
import { CreateClientRoleDto } from '../dto/create-client-role.dto';
import { AssignPermissionsDto } from '../dto/assign-permissions.dto';
import { RoleResponseDto } from '../dto/role-response.dto';
import { RolePaginatedResponseDto } from '../dto/role-paginated-response.dto';
import { ClientRoleQueryDto } from '../dto/client-role-query.dto';
import { ClientRoleResponseDto } from '../dto/client-role-response.dto';
import { PermissionResponseDto } from '../../permission/dto/permission-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { Permissions } from '../../permission/decorators/permissions.decorator';
import { PermissionKey } from '../../permission/constants/permission-key.enum';
import { RealmsService } from '../../realms/realms.service';

const CLIENT_ROLE_ID_PARAM = {
  name: 'clientRoleId',
  required: true,
  format: 'uuid',
  description: 'UUID of the client role',
} as const;

const USER_ID_PARAM = {
  name: 'userId',
  required: true,
  format: 'uuid',
  description: 'UUID of the user',
} as const;

@ApiTags('Client Roles')
@Controller('realms/:realmName/clients/:clientId/roles')
@ApiBearerAuth('authorization')
@ApiParam({
  name: 'realmName',
  required: true,
  example: 'master',
  description: 'Name of the realm the client belongs to',
})
@ApiParam({
  name: 'clientId',
  required: true,
  description: 'UUID of the client the roles belong to',
})
export class ClientRolesController {
  constructor(
    private readonly clientRolesService: ClientRolesService,
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

  // ----- Client roles --------------------------------------------------------

  @Permissions([PermissionKey.CLIENT_ROLES_CREATE])
  @Post()
  @ApiOperation({
    summary: 'Create a client role',
    description: 'Creates a new role scoped to the given client within the given realm.',
  })
  @ApiResponse({ status: 201, description: 'Client role created.' })
  @ApiResponse({ status: 404, description: "Realm not found, or client not found in this realm." })
  @ApiResponse({ status: 409, description: 'A role with this name already exists on this client.' })
  async create(
    @Param('realmName') realmName: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateClientRoleDto,
  ) {
    const realmId = await this.resolveRealmId(realmName);
    const result = await this.clientRolesService.createClientRole(realmId, clientId, dto);
    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.CLIENT_ROLES_READ])
  @Get()
  @ApiOperation({
    summary: 'List client roles',
    description: 'Lists all roles defined on the given client (paginated).',
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (1-indexed)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc', 'ASC', 'DESC'], example: 'DESC', description: 'Sort direction' })
  @ApiQuery({ name: 'search', required: false, example: 'Admin', description: 'Search by client role name' })
  @ApiResponse({ status: 200, description: 'Paginated list of client roles.' })
  @ApiResponse({ status: 404, description: 'Realm not found, or client not found in this realm.' })
  async findAll(
    @Param('realmName') realmName: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() queryDto: ClientRoleQueryDto,
  ) {
    const realmId = await this.resolveRealmId(realmName);
    const result = await this.clientRolesService.findAllPaginated(
      realmId,
      clientId,
      queryDto.page,
      queryDto.limit,
      queryDto.order,
      queryDto.search,
    );
    return plainToInstance(RolePaginatedResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.CLIENT_ROLES_DELETE])
  @Delete(':clientRoleId')
  @ApiOperation({
    summary: 'Delete a client role',
    description: 'Soft-deletes a client role.',
  })
  @ApiParam(CLIENT_ROLE_ID_PARAM)
  @ApiResponse({ status: 200, description: 'Client role soft-deleted.' })
  @ApiResponse({ status: 404, description: 'Client role not found.' })
  remove(@Param('clientRoleId', ParseUUIDPipe) clientRoleId: string) {
    return this.clientRolesService.deleteClientRole(clientRoleId);
  }

  // ----- Client role <-> Users -----------------------------------------------

  @Permissions([PermissionKey.CLIENT_ROLES_ASSIGN_USERS])
  @Post(':clientRoleId/users/:userId')
  @ApiOperation({ summary: 'Assign a user to a client role' })
  @ApiParam(CLIENT_ROLE_ID_PARAM)
  @ApiParam({ name: 'userId', required: true, format: 'uuid', description: 'UUID of the user to assign' })
  @ApiResponse({ status: 201, description: 'User assigned to the client role.' })
  @ApiResponse({ status: 404, description: 'Realm, client, or client role not found.' })
  @ApiResponse({ status: 409, description: 'User already has this client role.' })
  async assignUser(
    @Param('realmName') realmName: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    const realmId = await this.resolveRealmId(realmName);
    const result = await this.clientRolesService.assignClientRoleToUser(
      realmId,
      clientId,
      userId,
      clientRoleId,
    );
    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.CLIENT_ROLES_ASSIGN_USERS])
  @Delete(':clientRoleId/users/:userId')
  @ApiOperation({ summary: 'Unassign a user from a client role' })
  @ApiParam(CLIENT_ROLE_ID_PARAM)
  @ApiParam({ name: 'userId', required: true, format: 'uuid', description: 'UUID of the user to unassign' })
  @ApiResponse({ status: 200, description: 'User unassigned from the client role.' })
  @ApiResponse({ status: 404, description: 'Assignment not found.' })
  unassignUser(
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.clientRolesService.unassignClientRoleFromUser(userId, clientRoleId);
  }

  // ----- Client role <-> Permissions -----------------------------------------

  @Permissions([PermissionKey.CLIENT_ROLES_ASSIGN_PERMISSIONS])
  @Post(':clientRoleId/permissions')
  @ApiOperation({
    summary: 'Assign permissions to a client role',
    description: 'Assigns one or more realm-scoped permissions to a client role.',
  })
  @ApiParam(CLIENT_ROLE_ID_PARAM)
  @ApiResponse({ status: 201, description: 'Permissions assigned to the client role.' })
  @ApiResponse({ status: 404, description: 'Realm, client, or client role not found; or one or more permissions not found in this realm.' })
  async addPermissions(
    @Param('realmName') realmName: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    const realmId = await this.resolveRealmId(realmName);
    const result = await this.clientRolesService.addPermissionsToClientRole(
      realmId,
      clientId,
      clientRoleId,
      dto.permissionIds,
    );
    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.CLIENT_ROLES_READ])
  @Get(':clientRoleId/permissions')
  @ApiOperation({ summary: 'List permissions granted by a client role' })
  @ApiParam(CLIENT_ROLE_ID_PARAM)
  @ApiResponse({ status: 200, description: 'List of permissions granted by the client role.' })
  @ApiResponse({ status: 404, description: 'Realm, client, or client role not found.' })
  async listPermissions(
    @Param('realmName') realmName: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
  ) {
    const realmId = await this.resolveRealmId(realmName);
    const result = await this.clientRolesService.listClientRolePermissions(
      realmId,
      clientId,
      clientRoleId,
    );
    return plainToInstance(PermissionResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.CLIENT_ROLES_READ])
  @Get(':clientRoleId/users')
  @ApiOperation({ summary: 'List users assigned to a client role' })
  @ApiParam(CLIENT_ROLE_ID_PARAM)
  @ApiResponse({ status: 200, description: 'List of users assigned to the client role.' })
  @ApiResponse({ status: 404, description: 'Realm, client, or client role not found.' })
  async listUsers(
    @Param('realmName') realmName: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
  ) {
    const realmId = await this.resolveRealmId(realmName);
    const result = await this.clientRolesService.listClientRoleUsers(
      realmId,
      clientId,
      clientRoleId,
    );
    return plainToInstance(UserResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.CLIENT_ROLES_ASSIGN_PERMISSIONS])
  @Delete(':clientRoleId/permissions/:permissionId')
  @ApiOperation({ summary: 'Remove a permission from a client role' })
  @ApiParam(CLIENT_ROLE_ID_PARAM)
  @ApiParam({ name: 'permissionId', required: true, format: 'uuid', description: 'UUID of the permission to remove' })
  @ApiResponse({ status: 200, description: 'Permission removed from the client role.' })
  @ApiResponse({ status: 404, description: 'Realm, client, or client role not found.' })
  async removePermission(
    @Param('realmName') realmName: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ) {
    const realmId = await this.resolveRealmId(realmName);
    return this.clientRolesService.removePermissionFromClientRole(
      realmId,
      clientId,
      clientRoleId,
      permissionId,
    );
  }

  // ----- Client roles for a given user -----------------------------------------
  @Permissions([PermissionKey.USERS_READ])
  @Get('users/:userId')
  @ApiOperation({
    summary: "List a user's client roles",
    description: 'Returns the client roles currently assigned to this user, for this client.',
  })
  @ApiParam(USER_ID_PARAM)
  @ApiResponse({ status: 200, description: "The user's client roles for this client." })
  async listForUser(
    @Param('realmName') realmName: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    const realmId = await this.resolveRealmId(realmName);
    const assignments = await this.clientRolesService.findRolesForUser(realmId, clientId, userId);
    const result = assignments.map((assignment) => ({
      id: assignment.clientRole.id,
      name: assignment.clientRole.name,
      realmName: assignment.clientRole.realm?.realmName,
      clientId: assignment.client.id,
      clientName: assignment.client.name,
    }));
    return plainToInstance(ClientRoleResponseDto, result, { excludeExtraneousValues: true });
  }
}
