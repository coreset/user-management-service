import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { query } from 'winston';
import { SearchUserDto } from './dto/search-role.dto';
import { Permissions } from '../permission/decorators/permissions.decorator';
import { PermissionKey } from '../permission/constants/permission-key.enum';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

const ID_PARAM = {
  name: 'id',
  required: true,
  format: 'uuid',
  description: 'UUID of the user',
} as const;

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('authorization')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * @see
   */
  @Permissions([PermissionKey.USERS_CREATE])
  @Post(':realmName')
  @ApiOperation({
    summary: 'Create a user',
    description: 'Creates a new user within the given realm.',
  })
  @ApiParam({
    name: 'realmName',
    required: true,
    example: 'master',
    description: 'Name of the realm the user will belong to',
  })
  @ApiResponse({ status: 201, description: 'User created.' })
  @ApiResponse({ status: 404, description: "Realm 'realmName' not found." })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  create(
    @Param('realmName') realmName: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(createUserDto, realmName);
  }

  @Permissions([PermissionKey.USERS_READ])
  @Get()
  @ApiOperation({
    summary: 'List users',
    description: 'Lists every non-deleted user, across all realms.',
  })
  @ApiResponse({ status: 200, description: 'List of users.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search users by first name',
    description: 'Searches users by first name; paginates only when both page and limit are supplied.',
  })
  @ApiQuery({ name: 'name', required: true, example: 'firstname', description: 'First name to search for' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (1-indexed)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Page size' })
  @ApiResponse({ status: 200, description: 'Matching users (paginated if page/limit given).' })
  @ApiResponse({ status: 400, description: 'Missing search parameters (name given without both page and limit, or neither).' })
  search(@Query() query: SearchUserDto) {
    const { name, page, limit } = query;
    return this.usersService.searchAllPaginated(name, page, limit);

  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a user by id',
    description: "Fetches a user's public profile fields (firstName, lastName, avatarUrl) by UUID.",
  })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'The requested user, or null if no user has this id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Replace a user',
    description: 'Replaces the given user\'s fields with the supplied values.',
  })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'User updated.' })
  @ApiResponse({ status: 400, description: 'User not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  //@Patch(':id')
  //update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //  return this.usersService.update(+id, updateUserDto);
  //}

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 200, description: 'User deleted.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted user',
  })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: 201, description: 'User restored.' })
  @ApiResponse({ status: 404, description: 'User not found, or not deleted.' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.restore(id);
  }
}
