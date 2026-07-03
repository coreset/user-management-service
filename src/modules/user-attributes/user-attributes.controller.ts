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
import { Permissions } from '../permission/decorators/permissions.decorator';
import { PermissionKey } from '../permission/constants/permission-key.enum';

@Controller('users/:userId/attributes')
@ApiBearerAuth('authorization')
@Permissions([PermissionKey.USER_ATTRIBUTES_MANAGE])
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
