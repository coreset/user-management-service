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
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RealmsService } from './realms.service';
import { CreateRealmDto } from './dto/create-realm.dto';
import { UpdateRealmDto } from './dto/update-realm.dto';
import { Permissions } from '../permission/decorators/permissions.decorator';
import { PermissionKey } from '../permission/constants/permission-key.enum';

@Controller('realms')
@ApiBearerAuth('authorization')
export class RealmsController {
  constructor(private readonly realmsService: RealmsService) {}

  @Permissions([PermissionKey.REALMS_CREATE])
  @Post()
  create(@Body() createRealmDto: CreateRealmDto) {
    return this.realmsService.create(createRealmDto);
  }

  @Permissions([PermissionKey.REALMS_READ])
  @Get()
  findAll() {
    return this.realmsService.findAll();
  }

  @Permissions([PermissionKey.REALMS_READ])
  @Get(':realmName')
  @ApiParam({
    name: 'realmName',
    required: true,
    example: 'master',
    description: 'Name of the realm to fetch',
  })
  findOne(@Param('realmName') realmName: string) {
    return this.realmsService.findByName(realmName);
  }

  @Permissions([PermissionKey.REALMS_UPDATE])
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRealmDto: UpdateRealmDto,
  ) {
    return this.realmsService.update(id, updateRealmDto);
  }

  @Permissions([PermissionKey.REALMS_DELETE])
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.realmsService.remove(id);
  }
}
