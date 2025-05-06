import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, Request, Req, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { LocalLoginDto } from './dto/local-login.dto';
import { ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '../roles/enums/role.enum';
import { RolesGuard } from '../roles/guards/roles/roles.guard';

@Controller('auth')
@ApiBearerAuth('authorization') // for add authrization header with swagger
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @ApiBody({ type: LocalLoginDto }) // without dto in the request show parameters in the swagger
  @Post('login')
  login(@Request() req) {
    const token = this.authService.login(req.user.id);
    //return {id: req.user.id, token};
    return token;
  }

  @Post()
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @SetMetadata('role', [UserRole.ADMIN])
  @UseGuards(RolesGuard)
  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Request() req) {
    return this.authService.findAll();
  }

  @UseGuards(AuthGuard('refresh-jwt'))
  @Post('refresh')
  refreshToken(@Request() req) {
    const token: string = req.get('authorization')?.replace('Bearer', '')?.trim();
    return this.authService.refreshToken(req.user.id, token);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @SetMetadata('role', [UserRole.ADMIN]) // only ADMIN can delete user
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }

  @UseGuards(AuthGuard('refresh-jwt'))
  @Post('signout')
  async signOut(@Request() req) {
    const refreshToken = req.get('authorization')?.replace('Bearer', '').trim();
    await this.authService.signOutCurrentDevice(req.user.id, refreshToken);
    return { message: 'Signed out from current device' };
  }

  @UseGuards(AuthGuard('refresh-jwt'))
  @Post('signout-all')
  async signOutAll(@Request() req) {
    await this.authService.signOutAllDevices(req.user.id);
    return { message: 'Signed out from all devices' };
  }
}
