import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  SetMetadata,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from './guards/roles/roles.guard';
import { FixedUserRole, UserRole } from './enums/role.enum';
import { Request } from 'express';
import { PaginateRoleDto } from './dto/paginate-role.dto';
import { SearchRoleDto } from './dto/search-role.dto';
import { AssignUsersDto } from './dto/asign-users.dto';
import { AssignPermissionsDto } from './dto/asign-permissions.dto';

@Controller('roles')
@ApiBearerAuth('authorization') // for add authrization header with swagger
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  //@UseGuards(AuthGuard('jwt'))
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
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
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  //@SetMetadata('role', [FixedUserRole.ADMIN])
  //@UseGuards(RolesGuard)
  //@UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  softDelete(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.rolesService.softDelete(id);
  }

  @Post(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.restore(id);
  }

  @Post(':roleId/assign-users')
  assignUsersToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    return this.rolesService.assignUsersToRole(roleId, assignUsersDto.userIdList);
  }

  @Post(':roleId/unassign-users')
  unassignUsersToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    return this.rolesService.unassignUsersFromRole(roleId, assignUsersDto.userIdList);
  }

  @Post(':roleId/assign-permissions')
  assignPermissionsToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissionsToRole(roleId, assignPermissionsDto.permissionIdList);
  }

  @Post(':roleId/unassign-permissions')
  unassignPermissionsToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.unassignPermissionsFromRole(roleId, assignPermissionsDto.permissionIdList);
  }
}
