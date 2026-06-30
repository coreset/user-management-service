import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserAttributesService } from './user-attributes.service';
import { SetAttributeDto } from './dto/set-attribute.dto';
import { FixedUserRole } from '../roles/enums/role.enum';
import { Roles } from '../roles/decorators/roles.decorator';

@Controller('users/:userId/attributes')
@ApiBearerAuth('authorization')
@Roles([FixedUserRole.SUPER_ADMIN, FixedUserRole.REALM_ADMIN])
export class UserAttributesController {
  constructor(private readonly userAttributesService: UserAttributesService) {}

  @Get()
  list(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userAttributesService.list(userId);
  }

  @Put(':key')
  set(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('key') key: string,
    @Body() dto: SetAttributeDto,
  ) {
    return this.userAttributesService.set(userId, key, dto.value);
  }

  @Delete(':key')
  remove(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('key') key: string,
  ) {
    return this.userAttributesService.remove(userId, key);
  }
}
