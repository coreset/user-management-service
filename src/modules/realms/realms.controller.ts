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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { RealmsService } from './realms.service';
import { CreateRealmDto } from './dto/create-realm.dto';
import { UpdateRealmDto } from './dto/update-realm.dto';
import { RealmResponseDto } from './dto/realm-response.dto';
import { RealmPaginatedResponseDto } from './dto/realm-paginated-response.dto';
import { RealmQueryDto } from './dto/realm-query.dto';
import { Permissions } from '../permission/decorators/permissions.decorator';
import { PermissionKey } from '../permission/constants/permission-key.enum';

const ID_PARAM = {
  name: 'id',
  required: true,
  format: 'uuid',
  description: 'UUID of the realm',
} as const;

@ApiTags('Realms')
@Controller('realms')
@ApiBearerAuth('authorization')
export class RealmsController {
  constructor(private readonly realmsService: RealmsService) {}

  @Permissions([PermissionKey.REALMS_CREATE])
  @Post()
  @ApiOperation({
    summary: 'Create a realm',
    description: 'Creates a new realm and auto-generates its RSA signing key pair.',
  })
  @ApiResponse({ status: 201, description: 'Realm created.' })
  @ApiResponse({ status: 409, description: "A realm with this realmName already exists." })
  async create(@Body() createRealmDto: CreateRealmDto) {
    const result = await this.realmsService.create(createRealmDto);
    return plainToInstance(RealmResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.REALMS_READ])
  @Get()
  @ApiOperation({
    summary: 'List realms',
    description: 'Lists every realm (paginated), optionally filtered by realm name.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (1-indexed)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc', 'ASC', 'DESC'], example: 'DESC', description: 'Sort direction' })
  @ApiQuery({ name: 'search', required: false, example: 'master', description: 'Search by realm name (wildcard)' })
  @ApiResponse({ status: 200, description: 'Paginated list of realms.' })
  async findAll(@Query() queryDto: RealmQueryDto) {
    const result = await this.realmsService.findAllPaginated(
      queryDto.page,
      queryDto.limit,
      queryDto.order,
      queryDto.search,
    );
    return plainToInstance(RealmPaginatedResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.REALMS_READ])
  @Get(':realmName')
  @ApiOperation({
    summary: 'Get a realm by name',
    description: 'Fetches a single realm by its (globally-unique) name.',
  })
  @ApiParam({
    name: 'realmName',
    required: true,
    example: 'master',
    description: 'Name of the realm to fetch',
  })
  @ApiResponse({ status: 200, description: 'The requested realm, or null if no realm has this name.' })
  async findOne(@Param('realmName') realmName: string) {
    const result = await this.realmsService.findByName(realmName);
    return plainToInstance(RealmResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.REALMS_UPDATE])
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a realm',
    description: 'Partially updates a realm (any subset of fields) by its UUID.',
  })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'Realm updated.' })
  @ApiResponse({ status: 404, description: 'Realm not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRealmDto: UpdateRealmDto,
  ) {
    const result = await this.realmsService.update(id, updateRealmDto);
    return plainToInstance(RealmResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.REALMS_DELETE])
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a realm',
    description: 'Permanently removes a realm by its UUID.',
  })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'Realm deleted.' })
  @ApiResponse({ status: 404, description: 'Realm not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.realmsService.remove(id);
  }
}
