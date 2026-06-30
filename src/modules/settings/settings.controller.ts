import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { SetSettingDto } from './dto/set-setting.dto';
import { FixedUserRole } from '../roles/enums/role.enum';
import { Roles } from '../roles/decorators/roles.decorator';
import { AuthRequest } from '../auth/types/request';

@Controller('settings')
@ApiBearerAuth('authorization')
@Roles([FixedUserRole.SUPER_ADMIN, FixedUserRole.REALM_ADMIN])
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  list(@Req() req: AuthRequest) {
    return this.settingsService.list(req.user.realmId!);
  }

  @Get(':key')
  get(@Req() req: AuthRequest, @Param('key') key: string) {
    return this.settingsService.get(req.user.realmId!, key);
  }

  @Put(':key')
  set(
    @Req() req: AuthRequest,
    @Param('key') key: string,
    @Body() dto: SetSettingDto,
  ) {
    return this.settingsService.set(req.user.realmId!, key, dto.value);
  }

  @Delete(':key')
  reset(@Req() req: AuthRequest, @Param('key') key: string) {
    return this.settingsService.reset(req.user.realmId!, key);
  }
}
