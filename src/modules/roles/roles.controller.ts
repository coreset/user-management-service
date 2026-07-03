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
import { PaginateRoleDto } from './dto/paginate-role.dto';
import { SearchRoleDto } from './dto/search-role.dto';
import { AssignUsersDto } from './dto/asign-users.dto';
import { AssignPermissionsDto } from './dto/asign-permissions.dto';

@Controller('roles')
@ApiBearerAuth('authorization') // for add authrization header with swagger
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions([PermissionKey.ROLES_CREATE])
  create(@Req() req: AuthRequest, @Body() createRoleDto: CreateRoleDto) {
    // Realm roles are scoped to the caller's realm.
    return this.rolesService.create(createRoleDto, req.user.realmId);
  }

  @Get()
  //@UseGuards(AuthGuard('jwt'))
  findAll(@Query() { page = 1, limit = 10}: PaginateRoleDto) {
    return this.rolesService.findAllPaginated(page, limit);
  }

  @Get('search')
  search(@Query() query: SearchRoleDto) {
    const { name, page, limit } = query;
    return this.rolesService.searchAllPaginated(name, page, limit);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  //@SetMetadata('role', [FixedUserRole.ADMIN])
  //@UseGuards(RolesGuard)
  //@UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.softDelete(id);
  }

  @Post(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.restore(id);
  }

  @Post(':roleId/assign-users')
  assignUsersToRole(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    return this.rolesService.assignUsersToRole(roleId, assignUsersDto.userIdList);
  }

  @Post(':roleId/unassign-users')
  unassignUsersToRole(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    return this.rolesService.unassignUsersFromRole(roleId, assignUsersDto.userIdList);
  }

  @Post(':roleId/assign-permissions')
  assignPermissionsToRole(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissionsToRole(roleId, assignPermissionsDto.permissionIdList);
  }

  @Post(':roleId/unassign-permissions')
  unassignPermissionsToRole(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.unassignPermissionsFromRole(roleId, assignPermissionsDto.permissionIdList);
  }
}
