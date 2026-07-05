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
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateClientRoleDto } from './dto/create-client-role.dto';
import { AssignClientRoleDto } from './dto/assign-client-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { Permissions } from '../permission/decorators/permissions.decorator';
import { PermissionKey } from '../permission/constants/permission-key.enum';
import { AuthRequest } from '../auth/types/request';

@Controller('clients')
@ApiBearerAuth('authorization')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ----- Clients -------------------------------------------------------------

  @Permissions([PermissionKey.CLIENTS_CREATE])
  @Post()
  create(@Req() req: AuthRequest, @Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(req.user.realmId!, createClientDto);
  }

  @Permissions([PermissionKey.CLIENTS_READ])
  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.clientsService.findAll(req.user.realmId!);
  }

  @Permissions([PermissionKey.CLIENTS_READ])
  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.findOne(req.user.realmId!, id);
  }

  @Permissions([PermissionKey.CLIENTS_UPDATE])
  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(req.user.realmId!, id, updateClientDto);
  }

  @Permissions([PermissionKey.CLIENTS_DELETE])
  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.remove(req.user.realmId!, id);
  }

  // ----- Client roles --------------------------------------------------------

  @Permissions([PermissionKey.CLIENT_ROLES_CREATE])
  @Post(':id/roles')
  createClientRole(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateClientRoleDto,
  ) {
    return this.clientsService.createClientRole(req.user.realmId!, id, dto);
  }

  @Permissions([PermissionKey.CLIENT_ROLES_READ])
  @Get(':id/roles')
  listClientRoles(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clientsService.listClientRoles(req.user.realmId!, id);
  }

  @Permissions([PermissionKey.CLIENT_ROLES_DELETE])
  @Delete('roles/:clientRoleId')
  deleteClientRole(
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
  ) {
    return this.clientsService.deleteClientRole(clientRoleId);
  }

  // ----- User <-> client role assignment ------------------------------------

  @Permissions([PermissionKey.CLIENT_ROLES_ASSIGN_USERS])
  @Post(':id/assign-role')
  assignClientRoleToUser(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignClientRoleDto,
  ) {
    return this.clientsService.assignClientRoleToUser(
      req.user.realmId!,
      id,
      dto.userId,
      dto.clientRoleId,
    );
  }

  @Permissions([PermissionKey.CLIENT_ROLES_ASSIGN_USERS])
  @Post('unassign-role')
  unassignClientRoleFromUser(@Body() dto: AssignClientRoleDto) {
    return this.clientsService.unassignClientRoleFromUser(
      dto.userId,
      dto.clientRoleId,
    );
  }

  // ----- Client role <-> permission assignment ------------------------------

  @Permissions([PermissionKey.CLIENT_ROLES_ASSIGN_PERMISSIONS])
  @Post(':id/roles/:clientRoleId/permissions')
  addClientRolePermissions(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.clientsService.addPermissionsToClientRole(
      req.user.realmId!,
      id,
      clientRoleId,
      dto.permissionIds,
    );
  }

  @Permissions([PermissionKey.CLIENT_ROLES_READ])
  @Get(':id/roles/:clientRoleId/permissions')
  listClientRolePermissions(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
  ) {
    return this.clientsService.listClientRolePermissions(
      req.user.realmId!,
      id,
      clientRoleId,
    );
  }

  @Permissions([PermissionKey.CLIENT_ROLES_ASSIGN_PERMISSIONS])
  @Delete(':id/roles/:clientRoleId/permissions/:permissionId')
  removeClientRolePermission(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ) {
    return this.clientsService.removePermissionFromClientRole(
      req.user.realmId!,
      id,
      clientRoleId,
      permissionId,
    );
  }
}
