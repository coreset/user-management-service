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
import { RealmRolesService } from '../services/realm-roles.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Permissions } from '../../permission/decorators/permissions.decorator';
import { PermissionKey } from '../../permission/constants/permission-key.enum';
import { RoleQueryDto } from '../dto/role-query.dto';
import { AssignUsersDto } from '../dto/assign-users.dto';
import { AssignPermissionsDto } from '../dto/assign-permissions.dto';
import { RealmsService } from '../../realms/realms.service';

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
  async create(
    @Param('realmName') realmName: string,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    // Realm roles are scoped to the realm named in the path.
    const realmId = await this.resolveRealmId(realmName);
    return this.realmRolesService.create(createRoleDto, realmId);
  }

  // GET /realms/:realmName/roles — plain list, or filtered with ?name=...
  @Permissions([PermissionKey.ROLES_READ])
  @Get()
  findAll(@Query() { name, page = 1, limit = 10 }: RoleQueryDto) {
    return this.realmRolesService.findAllPaginated(page, limit, name);
  }

  @Permissions([PermissionKey.ROLES_READ])
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.realmRolesService.findOne(id);
  }

  @Permissions([PermissionKey.ROLES_UPDATE])
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.realmRolesService.update(id, updateRoleDto);
  }

  @Permissions([PermissionKey.ROLES_DELETE])
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.realmRolesService.softDelete(id);
  }

  @Permissions([PermissionKey.ROLES_DELETE])
  @Post(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.realmRolesService.restore(id);
  }

  // ----- Role <-> Users (nested sub-resource) --------------------------------
  @Permissions([PermissionKey.ROLES_ASSIGN_USERS])
  @Post(':roleId/users')
  addUsers(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    return this.realmRolesService.assignUsersToRole(roleId, assignUsersDto.userIdList);
  }

  @Permissions([PermissionKey.ROLES_ASSIGN_USERS])
  @Delete(':roleId/users/:userId')
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
  addPermissions(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.realmRolesService.assignPermissionsToRole(roleId, assignPermissionsDto.permissionIds);
  }

  @Permissions([PermissionKey.ROLES_ASSIGN_PERMISSIONS])
  @Delete(':roleId/permissions/:permissionId')
  removePermission(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ) {
    return this.realmRolesService.unassignPermissionsFromRole(roleId, [permissionId]);
  }
}
