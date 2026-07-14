import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permissions } from './decorators/permissions.decorator';
import { PermissionKey } from './constants/permission-key.enum';

const ID_PARAM = {
  name: 'id',
  required: true,
  description: 'UUID of the permission',
} as const;

@ApiTags('Permissions')
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
  @ApiOperation({
    summary: 'Create a permission',
    description: 'Adds a new permission key to the realm\'s permission catalog (realm-scoped; UNIQUE(realm_id, name)).',
  })
  @ApiResponse({ status: 201, description: 'Permission created.' })
  @ApiResponse({ status: 404, description: "Realm 'realmName' not found." })
  @ApiResponse({ status: 409, description: 'A permission with this name already exists in this realm.' })
  create(
    @Param('realmName') realmName: string,
    @Body() createPermissionDto: CreatePermissionDto,
  ) {
    return this.permissionService.create(realmName, createPermissionDto);
  }

  @Permissions([PermissionKey.PERMISSIONS_READ])
  @Get()
  @ApiOperation({
    summary: 'List permissions',
    description: "Lists every permission in the realm's catalog.",
  })
  @ApiResponse({ status: 200, description: 'List of permissions in the realm.' })
  @ApiResponse({ status: 404, description: "Realm 'realmName' not found." })
  findAll(@Param('realmName') realmName: string) {
    return this.permissionService.findAll(realmName);
  }

  @Permissions([PermissionKey.PERMISSIONS_READ])
  @Get(':id')
  @ApiOperation({ summary: 'Get a permission by id' })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'The requested permission.' })
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(id);
  }

  @Permissions([PermissionKey.PERMISSIONS_UPDATE])
  @Patch(':id')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'Permission updated.' })
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Permissions([PermissionKey.PERMISSIONS_DELETE])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'Permission deleted.' })
  remove(@Param('id') id: string) {
    return this.permissionService.remove(id);
  }
}
