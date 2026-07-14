import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserAttributesService } from './user-attributes.service';
import { SetAttributeDto } from './dto/set-attribute.dto';
import { Permissions } from '../permission/decorators/permissions.decorator';
import { PermissionKey } from '../permission/constants/permission-key.enum';

const USER_ID_PARAM = {
  name: 'userId',
  required: true,
  format: 'uuid',
  description: 'UUID of the user',
} as const;

const KEY_PARAM = {
  name: 'key',
  required: true,
  example: 'department',
  description: 'Attribute key (see AttributeDefinition catalog)',
} as const;

@ApiTags('User Attributes')
@Controller('users/:userId/attributes')
@ApiBearerAuth('authorization')
@Permissions([PermissionKey.USER_ATTRIBUTES_MANAGE])
export class UserAttributesController {
  constructor(private readonly userAttributesService: UserAttributesService) {}

  @Get()
  @ApiOperation({
    summary: "List a user's attributes",
    description: 'Every known attribute definition, overlaid with values set for this user.',
  })
  @ApiParam(USER_ID_PARAM)
  @ApiResponse({ status: 200, description: "List of the user's effective attributes." })
  list(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userAttributesService.list(userId);
  }

  @Put(':key')
  @ApiOperation({
    summary: "Set a user's attribute value",
    description: 'Upserts the value for an allowed attribute key.',
  })
  @ApiParam(USER_ID_PARAM)
  @ApiParam(KEY_PARAM)
  @ApiResponse({ status: 200, description: 'Attribute saved.' })
  @ApiResponse({ status: 400, description: 'Not an allowed attribute key, or value fails validation for its value type.' })
  set(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('key') key: string,
    @Body() dto: SetAttributeDto,
  ) {
    return this.userAttributesService.set(userId, key, dto.value);
  }

  @Delete(':key')
  @ApiOperation({
    summary: "Remove a user's attribute value",
  })
  @ApiParam(USER_ID_PARAM)
  @ApiParam(KEY_PARAM)
  @ApiResponse({ status: 200, description: 'Attribute removed.' })
  @ApiResponse({ status: 400, description: 'Attribute is required and cannot be removed.' })
  @ApiResponse({ status: 404, description: 'Attribute not set for this user.' })
  remove(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('key') key: string,
  ) {
    return this.userAttributesService.remove(userId, key);
  }
}
