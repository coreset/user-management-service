import { Controller, Get, Delete, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { SessionsService } from './sessions.service';
import { SessionQueryDto } from './dto/session-query.dto';
import { SessionPaginatedResponseDto } from './dto/session-paginated-response.dto';
import { Permissions } from '../permission/decorators/permissions.decorator';
import { PermissionKey } from '../permission/constants/permission-key.enum';

const ID_PARAM = {
  name: 'id',
  required: true,
  format: 'uuid',
  description: 'UUID of the session',
} as const;

@ApiTags('Sessions')
@Controller('realms/:realmName/sessions')
@ApiBearerAuth('authorization')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Permissions([PermissionKey.SESSIONS_READ])
  @Get()
  @ApiOperation({
    summary: 'List sessions',
    description: "Lists this realm's SSO sessions (paginated), optionally filtered by owner or active status.",
  })
  @ApiParam({ name: 'realmName', required: true, example: 'master', description: 'Name of the realm' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (1-indexed)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc', 'ASC', 'DESC'], example: 'DESC', description: 'Sort direction' })
  @ApiQuery({ name: 'search', required: false, example: 'jdoe', description: 'Search by owner username or email (wildcard)' })
  @ApiQuery({ name: 'isActive', required: false, example: true, type: Boolean, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Paginated list of sessions.' })
  @ApiResponse({ status: 404, description: "Realm 'realmName' not found." })
  async findAll(@Param('realmName') realmName: string, @Query() queryDto: SessionQueryDto) {
    const result = await this.sessionsService.findAllPaginated(
      realmName,
      queryDto.page,
      queryDto.limit,
      queryDto.order,
      queryDto.search,
      queryDto.isActive,
    );
    return plainToInstance(SessionPaginatedResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Permissions([PermissionKey.SESSIONS_REVOKE])
  @Delete(':id')
  @ApiOperation({
    summary: 'Revoke a session',
    description: 'Marks a session inactive, signing that user out of every client in the realm.',
  })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'Session revoked.' })
  @ApiResponse({ status: 404, description: 'Session not found in this realm.' })
  async revoke(@Param('realmName') realmName: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.sessionsService.revoke(realmName, id);
  }
}
