import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  SetMetadata,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateClientRoleDto } from './dto/create-client-role.dto';
import { AssignClientRoleDto } from './dto/assign-client-role.dto';
import { RolesGuard } from '../roles/guards/roles/roles.guard';
import { FixedUserRole } from '../roles/enums/role.enum';
import { AuthRequest } from '../auth/types/request';

@Controller('clients')
@ApiBearerAuth('authorization')
@SetMetadata('role', [FixedUserRole.SUPER_ADMIN, FixedUserRole.REALM_ADMIN])
@UseGuards(AuthGuard('jwt-rs256'), RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ----- Clients -------------------------------------------------------------

  @Post()
  create(@Req() req: AuthRequest, @Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(req.user.realmId!, createClientDto);
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.clientsService.findAll(req.user.realmId!);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.findOne(req.user.realmId!, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(req.user.realmId!, id, updateClientDto);
  }

  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.remove(req.user.realmId!, id);
  }

  // ----- Client roles --------------------------------------------------------

  @Post(':id/roles')
  createClientRole(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateClientRoleDto,
  ) {
    return this.clientsService.createClientRole(req.user.realmId!, id, dto);
  }

  @Get(':id/roles')
  listClientRoles(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clientsService.listClientRoles(req.user.realmId!, id);
  }

  @Delete('roles/:clientRoleId')
  deleteClientRole(
    @Param('clientRoleId', ParseUUIDPipe) clientRoleId: string,
  ) {
    return this.clientsService.deleteClientRole(clientRoleId);
  }

  // ----- User <-> client role assignment ------------------------------------

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

  @Post('unassign-role')
  unassignClientRoleFromUser(@Body() dto: AssignClientRoleDto) {
    return this.clientsService.unassignClientRoleFromUser(
      dto.userId,
      dto.clientRoleId,
    );
  }
}
