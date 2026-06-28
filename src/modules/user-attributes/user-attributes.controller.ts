import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  SetMetadata,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserAttributesService } from './user-attributes.service';
import { SetAttributeDto } from './dto/set-attribute.dto';
import { RolesGuard } from '../roles/guards/roles/roles.guard';
import { FixedUserRole } from '../roles/enums/role.enum';

@Controller('users/:userId/attributes')
@ApiBearerAuth('authorization')
@SetMetadata('role', [FixedUserRole.SUPER_ADMIN, FixedUserRole.REALM_ADMIN])
@UseGuards(AuthGuard('jwt-rs256'), RolesGuard)
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
