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
}
