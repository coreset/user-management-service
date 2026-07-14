import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RealmsService } from './realms.service';
import { CreateRealmDto } from './dto/create-realm.dto';
import { UpdateRealmDto } from './dto/update-realm.dto';
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
  create(@Body() createRealmDto: CreateRealmDto) {
    return this.realmsService.create(createRealmDto);
  }

  @Permissions([PermissionKey.REALMS_READ])
  @Get()
  @ApiOperation({
    summary: 'List realms',
    description: 'Lists every realm.',
  })
  @ApiResponse({ status: 200, description: 'List of realms.' })
  findAll() {
    return this.realmsService.findAll();
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
  findOne(@Param('realmName') realmName: string) {
    return this.realmsService.findByName(realmName);
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
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRealmDto: UpdateRealmDto,
  ) {
    return this.realmsService.update(id, updateRealmDto);
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
