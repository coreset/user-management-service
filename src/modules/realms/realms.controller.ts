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
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RealmsService } from './realms.service';
import { CreateRealmDto } from './dto/create-realm.dto';
import { UpdateRealmDto } from './dto/update-realm.dto';
import { RolesGuard } from '../roles/guards/roles/roles.guard';
import { FixedUserRole } from '../roles/enums/role.enum';

@Controller('realms')
@ApiBearerAuth('authorization')
@SetMetadata('role', [FixedUserRole.SUPER_ADMIN])
@UseGuards(AuthGuard('jwt-rs256'), RolesGuard)
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
