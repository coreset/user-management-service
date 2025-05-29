import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  SetMetadata,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { LocalLoginDto } from './dto/local-login.dto';
import { ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { FixedUserRole } from '../roles/enums/role.enum';
import { RolesGuard } from '../roles/guards/roles/roles.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Response } from 'express';
import { AuthRequest as Request } from './types/request';
import { VerifyIdentifierDto } from './dto/verify-indentifier.dto';

@Controller('auth')
@ApiBearerAuth('authorization') // for add authrization header with swagger
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @ApiBody({ type: LocalLoginDto }) // without dto in the request show parameters in the swagger
  @Post('login')
  login(@Req() req) {
    const token = this.authService.login(req.user.id);
    //return {id: req.user.id, token};
    return token;
  }

  @Post()
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @SetMetadata('role', [FixedUserRole.ADMIN])
  @UseGuards(RolesGuard)
  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Req() req: Request) {
    return this.authService.findAll(req.user.id);
  }

  @UseGuards(AuthGuard('refresh-jwt'))
  @Post('refresh')
  refreshToken(@Req() req: Request) {
    const token: string = req.get('authorization')!.replace('Bearer', '').trim();
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

  @SetMetadata('role', [FixedUserRole.ADMIN]) // only ADMIN can delete user
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }

  @UseGuards(AuthGuard('refresh-jwt'))
  @Post('signout')
  async signOut(@Req() req: Request) {
    const refreshToken: string = req.get('authorization')!.replace('Bearer', '').trim();
    await this.authService.signOutCurrentDevice(req.user.id, refreshToken);
    return { message: 'Signed out from current device' };
  }

  @UseGuards(AuthGuard('refresh-jwt'))
  @Post('signout/all')
  async signOutAll(@Req() req: Request) {
    await this.authService.signOutAllDevices(req.user.id);
    return { message: 'Signed out from all devices' };
  }

  // GOOGLE AUTH 2 ***********************************************************
  @Get('google/login')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {
    console.log(req.body);
    // Redirects to Google login
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) { // this is calling from google 
    const response = await this.authService.login(req.user.id);
    res.redirect(`http://localhost:4200/login-success?token=${response.token}&refreshToken=${response.refreshToken}`);
  }

  // change password **********************************************************
  @UseGuards(AuthGuard('jwt'))
  @Put('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.changePassword(
      req.user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(
      forgotPasswordDto.email,
      forgotPasswordDto.type,
    );
  }

  @Post('verify-identifier')
  verifyIdentifier(
    @Body() verifyIdentifierDto: VerifyIdentifierDto,
  ) {
    return this.authService.verifyIdentifier(
      verifyIdentifierDto.token,
      verifyIdentifierDto.user,
    );
  }
}
