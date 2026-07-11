import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permissions } from './decorators/permissions.decorator';
import { PermissionKey } from './constants/permission-key.enum';

@Controller('realms/:realmName/permissions')
@ApiBearerAuth('authorization')
@ApiParam({
  name: 'realmName',
  required: true,
  example: 'master',
  description: 'Name of the realm the permissions belong to',
})
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Permissions([PermissionKey.PERMISSIONS_CREATE])
  @Post()
  create(
    @Param('realmName') realmName: string,
    @Body() createPermissionDto: CreatePermissionDto,
  ) {
    return this.permissionService.create(realmName, createPermissionDto);
  }

  @Permissions([PermissionKey.PERMISSIONS_READ])
  @Get()
  findAll(@Param('realmName') realmName: string) {
    return this.permissionService.findAll(realmName);
  }

  @Permissions([PermissionKey.PERMISSIONS_READ])
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(id);
  }

  @Permissions([PermissionKey.PERMISSIONS_UPDATE])
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Permissions([PermissionKey.PERMISSIONS_DELETE])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionService.remove(id);
  }
}
