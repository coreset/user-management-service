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
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';


@Controller('users')
@ApiBearerAuth('authorization') 
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * @see
   */
  @Permissions([PermissionKey.USERS_CREATE])
  @Post(':realmName')
  @ApiParam({
    name: 'realmName',
    required: true,
    example: 'master',
    description: 'Name of the realm the user will belong to',
  })
  create(
    @Param('realmName') realmName: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(createUserDto, realmName);
  }

  @Permissions([PermissionKey.USERS_READ])
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('search')
  search(@Query() query: SearchUserDto) {
    const { name, page, limit } = query;
    return this.usersService.searchAllPaginated(name, page, limit);

  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
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
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.restore(id);
  }
}
