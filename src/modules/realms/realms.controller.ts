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
import { ApiBearerAuth } from '@nestjs/swagger';
import { RealmsService } from './realms.service';
import { CreateRealmDto } from './dto/create-realm.dto';
import { UpdateRealmDto } from './dto/update-realm.dto';
import { Permissions } from '../permission/decorators/permissions.decorator';
import { PermissionKey } from '../permission/constants/permission-key.enum';

@Controller('realms')
@ApiBearerAuth('authorization')
@Permissions([PermissionKey.REALMS_MANAGE])
export class RealmsController {
  constructor(private readonly realmsService: RealmsService) {}

  @Post()
  create(@Body() createRealmDto: CreateRealmDto) {
    return this.realmsService.create(createRealmDto);
  }

  @Get()
  findAll() {
    return this.realmsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.realmsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRealmDto: UpdateRealmDto,
  ) {
    return this.realmsService.update(id, updateRealmDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.realmsService.remove(id);
  }
}
