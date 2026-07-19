import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { PermissionPaginatedResponseDto } from './dto/permission-paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Permissions } from './decorators/permissions.decorator';
import { PermissionKey } from './constants/permission-key.enum';
import type { AuthRequest } from '../auth/types/request';

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
  async create(
    @Param('realmName') realmName: string,
    @Body() createPermissionDto: CreatePermissionDto,
  ) {
    const result = await this.permissionService.create(realmName, createPermissionDto);
    return plainToInstance(PermissionResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.PERMISSIONS_READ])
  @Get()
  @ApiOperation({
    summary: 'List permissions',
    description: "Lists every permission in the realm's catalog (paginated).",
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (1-indexed)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc', 'ASC', 'DESC'], example: 'DESC', description: 'Sort direction' })
  @ApiResponse({ status: 200, description: 'Paginated list of permissions in the realm.' })
  @ApiResponse({ status: 404, description: "Realm 'realmName' not found." })
  async findAll(
    @Param('realmName') realmName: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.permissionService.findAllPaginated(realmName, query.page, query.limit, query.order);
    return plainToInstance(PermissionPaginatedResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.PERMISSIONS_READ])
  @Get(':id')
  @ApiOperation({ summary: 'Get a permission by id' })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'The requested permission.' })
  async findOne(@Param('id') id: string) {
    const result = await this.permissionService.findOne(id);
    return plainToInstance(PermissionResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.PERMISSIONS_UPDATE])
  @Patch(':id')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'Permission updated.' })
  async update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    const result = await this.permissionService.update(id, updatePermissionDto);
    return plainToInstance(PermissionResponseDto, result, {
      excludeExtraneousValues: true,
    });
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

@ApiTags('Me')
@Controller('me')
@ApiBearerAuth('authorization')
export class MeController {
  @Get('permissions')
  @ApiOperation({
    summary: "Get the current user's effective permissions",
    description:
      "Returns the flattened permission keys granted to the authenticated user across their realm and client roles (already resolved onto req.user by the auth guard, no extra query needed).",
  })
  @ApiResponse({ status: 200, description: 'The permission keys granted to the current user.' })
  getMyPermissions(@Req() req: AuthRequest) {
    return { permissions: req.user.permissions ?? [] };
  }
}
