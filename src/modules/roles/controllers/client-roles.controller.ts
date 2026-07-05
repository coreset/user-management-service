import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ClientRolesService } from '../services/client-roles.service';
import { CreateClientRoleDto } from '../../clients/dto/create-client-role.dto';
import { AssignPermissionsDto } from '../../clients/dto/assign-permissions.dto';
import { Permissions } from '../../permission/decorators/permissions.decorator';
import { PermissionKey } from '../../permission/constants/permission-key.enum';
import { RealmsService } from '../../realms/realms.service';

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
  async create(
    @Param('realmName') realmName: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateClientRoleDto,
  ) {
    const realmId = await this.resolveRealmId(realmName);
    return this.clientRolesService.createClientRole(realmId, clientId, dto);
  }

  @Permissions([PermissionKey.CLIENT_ROLES_READ])
  @Get()
  async findAll(
    @Param('realmName') realmName: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ) {
    const realmId = await this.resolveRealmId(realmName);
    return this.clientRolesService.listClientRoles(realmId, clientId);
  }

  @Permissions([PermissionKey.CLIENT_ROLES_DELETE])
  @Delete(':clientRoleId')
  remove(@Param('clientRoleId', ParseUUIDPipe) clientRoleId: string) {
    return this.clientRolesService.deleteClientRole(clientRoleId);
  }

  // ----- Client role <-> Users -----------------------------------------------

  @Permissions([PermissionKey.CLIENT_ROLES_ASSIGN_USERS])
  @Post(':clientRoleId/users/:userId')
  async assignUser(
    @Param('realmName') realmName: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    const realmId = await this.resolveRealmId(realmName);
    return this.clientRolesService.assignClientRoleToUser(
      realmId,
      clientId,
      userId,
      clientRoleId,
    );
  }

  @Permissions([PermissionKey.CLIENT_ROLES_ASSIGN_USERS])
  @Delete(':clientRoleId/users/:userId')
  unassignUser(
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.clientRolesService.unassignClientRoleFromUser(userId, clientRoleId);
  }

  // ----- Client role <-> Permissions -----------------------------------------

  @Permissions([PermissionKey.CLIENT_ROLES_ASSIGN_PERMISSIONS])
  @Post(':clientRoleId/permissions')
  async addPermissions(
    @Param('realmName') realmName: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    const realmId = await this.resolveRealmId(realmName);
    return this.clientRolesService.addPermissionsToClientRole(
      realmId,
      clientId,
      clientRoleId,
      dto.permissionIds,
    );
  }

  @Permissions([PermissionKey.CLIENT_ROLES_READ])
  @Get(':clientRoleId/permissions')
  async listPermissions(
    @Param('realmName') realmName: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
  ) {
    const realmId = await this.resolveRealmId(realmName);
    return this.clientRolesService.listClientRolePermissions(
      realmId,
      clientId,
      clientRoleId,
    );
  }

  @Permissions([PermissionKey.CLIENT_ROLES_ASSIGN_PERMISSIONS])
  @Delete(':clientRoleId/permissions/:permissionId')
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
}
