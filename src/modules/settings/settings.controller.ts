import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { SettingsService } from './settings.service';
import { SetSettingDto } from './dto/set-setting.dto';
import { SettingResponseDto } from './dto/setting-response.dto';
import { Permissions } from '../permission/decorators/permissions.decorator';
import { PermissionKey } from '../permission/constants/permission-key.enum';
import { AuthRequest } from '../auth/types/request';

const KEY_PARAM = {
  name: 'key',
  required: true,
  example: 'password_reset_token_expire_in',
  description: 'Setting key (see SettingDefinition catalog)',
} as const;

@ApiTags('Settings')
@Controller('settings')
@ApiBearerAuth('authorization')
@Permissions([PermissionKey.SETTINGS_MANAGE])
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({
    summary: "List the caller's realm settings",
    description: 'Every known setting definition, overlaid with this realm\'s overrides (defaults where not overridden).',
  })
  @ApiResponse({ status: 200, description: 'List of effective settings for the realm.' })
  async list(@Req() req: AuthRequest) {
    const result = await this.settingsService.list(req.user.realmId!);
    return plainToInstance(SettingResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a single effective setting by key' })
  @ApiParam(KEY_PARAM)
  @ApiResponse({ status: 200, description: 'The effective setting (default or realm override).' })
  @ApiResponse({ status: 404, description: 'Unknown setting key.' })
  async get(@Req() req: AuthRequest, @Param('key') key: string) {
    const result = await this.settingsService.get(req.user.realmId!, key);
    return plainToInstance(SettingResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Put(':key')
  @ApiOperation({
    summary: 'Set a realm override for a setting',
    description: 'Upserts this realm\'s override value for an allowed setting key.',
  })
  @ApiParam(KEY_PARAM)
  @ApiResponse({ status: 200, description: 'Setting override saved.' })
  @ApiResponse({ status: 400, description: 'Not an allowed setting key, or value fails validation for its value type.' })
  async set(
    @Req() req: AuthRequest,
    @Param('key') key: string,
    @Body() dto: SetSettingDto,
  ) {
    const result = await this.settingsService.set(req.user.realmId!, key, dto.value);
    return plainToInstance(SettingResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':key')
  @ApiOperation({
    summary: 'Reset a setting to its default',
    description: 'Removes this realm\'s override so the setting falls back to its default value.',
  })
  @ApiParam(KEY_PARAM)
  @ApiResponse({ status: 200, description: 'Override removed.' })
  @ApiResponse({ status: 404, description: 'No override exists for this key in this realm.' })
  async reset(@Req() req: AuthRequest, @Param('key') key: string) {
    const result = await this.settingsService.reset(req.user.realmId!, key);
    return plainToInstance(SettingResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }
}
