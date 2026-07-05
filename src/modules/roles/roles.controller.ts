import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from '../permission/decorators/permissions.decorator';
import { PermissionKey } from '../permission/constants/permission-key.enum';
import { AuthRequest } from '../auth/types/request';
import { RoleQueryDto } from './dto/role-query.dto';
import { AssignUsersDto } from './dto/assign-users.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Controller('roles')
@ApiBearerAuth('authorization') // for add authrization header with swagger
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Permissions([PermissionKey.ROLES_CREATE])
  @Post()
  create(@Req() req: AuthRequest, @Body() createRoleDto: CreateRoleDto) {
    // Realm roles are scoped to the caller's realm.
    return this.rolesService.create(createRoleDto, req.user.realmId!);
  }

  // GET /roles — plain list, or filtered with ?name=... (no separate /search route).
  @Permissions([PermissionKey.ROLES_READ])
  @Get()
  findAll(@Query() { name, page = 1, limit = 10 }: RoleQueryDto) {
    return this.rolesService.findAllPaginated(page, limit, name);
  }

  @Permissions([PermissionKey.ROLES_READ])
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Permissions([PermissionKey.ROLES_UPDATE])
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Permissions([PermissionKey.ROLES_DELETE])
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.softDelete(id);
  }

  @Permissions([PermissionKey.ROLES_DELETE])
  @Post(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.restore(id);
  }

  // ----- Role <-> Users (nested sub-resource) --------------------------------
  @Permissions([PermissionKey.ROLES_ASSIGN_USERS])
  @Post(':roleId/users')
  addUsers(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    return this.rolesService.assignUsersToRole(roleId, assignUsersDto.userIdList);
  }

  @Permissions([PermissionKey.ROLES_ASSIGN_USERS])
  @Delete(':roleId/users/:userId')
  removeUser(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.rolesService.unassignUsersFromRole(roleId, [userId]);
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
    return this.rolesService.assignPermissionsToRole(roleId, assignPermissionsDto.permissionIdList);
  }

  @Permissions([PermissionKey.ROLES_ASSIGN_PERMISSIONS])
  @Delete(':roleId/permissions/:permissionId')
  removePermission(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ) {
    return this.rolesService.unassignPermissionsFromRole(roleId, [permissionId]);
  }
}
