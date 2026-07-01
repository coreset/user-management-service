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
import { Roles } from '../roles/decorators/roles.decorator';
import { FixedUserRole } from '../roles/enums/role.enum';
import { ApiBearerAuth } from '@nestjs/swagger';


@Controller('users')
@ApiBearerAuth('authorization') 
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles([FixedUserRole.SUPER_ADMIN, FixedUserRole.ADMIN])
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles([FixedUserRole.SUPER_ADMIN])
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
