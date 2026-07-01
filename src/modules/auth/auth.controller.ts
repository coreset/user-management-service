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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { LocalLoginDto } from './dto/local-login.dto';
import { ApiBody, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FixedUserRole } from '../roles/enums/role.enum';
import { Roles } from '../roles/decorators/roles.decorator';
import { Public } from './decorators/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Response } from 'express';
import { AuthRequest as Request } from './types/request';
import { VerifyIdentifierDto } from './dto/verify-indentifier.dto';
import { LocalRegisterDto } from './dto/local-register.dto';
import { plainToInstance } from 'class-transformer';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

@Controller('auth')
@ApiBearerAuth('authorization') // for add authrization header with swagger
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * @see 
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'realmName', example: 'master', description: 'Realm the user belongs to' })
  @ApiBody({ type: LocalLoginDto })
  @Post(':realmName/login')
  async login(
    @Param('realmName') realmName: string,
    @Body() loginDto: LocalLoginDto,
    @Req() req: Request,
  ) {
    // Credentials are validated here (realm comes from the path); `user` is then
    // handed to login() so it isn't fetched twice.
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
      realmName,
    );
    const result = await this.authService.login(
      user.id,
      {
        ip: req.ip,
        userAgent: req.get('user-agent') ?? undefined,
      },
      user,
    );
    return plainToInstance(LoginResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  // @Post()
  // create(@Body() createAuthDto: CreateAuthDto) {
  //   return this.authService.create(createAuthDto);
  // }

  /**
   * @see 
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'realmName', example: 'master', description: 'Realm the user registers into' })
  @ApiBody({type: LocalRegisterDto})
  @Post(':realmName/register')
  async register(
    @Param('realmName') realmName: string,
    @Body() localRegisterDto: LocalRegisterDto,
  ) {
    const user = await this.authService.register(localRegisterDto, realmName);
    return plainToInstance(
      RegisterResponseDto,
      {
        message:
          'Registration successful. Please verify your email address before logging in.',
        user,
      },
      { excludeExtraneousValues: true },
    );
  }

  @Roles([FixedUserRole.SUPER_ADMIN, FixedUserRole.ADMIN])
  @Get()
  findAll(@Req() req: Request) {
    return this.authService.findAll(req.user.id);
  }

  @Public()
  @UseGuards(AuthGuard('refresh-jwt'))
  @Post('refresh') // validates the refresh token against the hashed DB copy.
  refreshToken(@Req() req: Request) {
    const token: string = req.get('authorization')!.replace('Bearer', '').trim();
    return this.authService.refreshToken(req.user.id, token);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(id, updateAuthDto);
  }

  @Roles([FixedUserRole.ADMIN]) // only ADMIN can delete user
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(id);
  }

  @Public()
  @UseGuards(AuthGuard('refresh-jwt'))
  @Post('signout')
  async signOut(@Req() req: Request) {
    const refreshToken: string = req.get('authorization')!.replace('Bearer', '').trim();
    await this.authService.signOutCurrentDevice(req.user.id, refreshToken);
    return { message: 'Signed out from current device' };
  }

  @Public()
  @UseGuards(AuthGuard('refresh-jwt'))
  @Post('signout/all')
  async signOutAll(@Req() req: Request) {
    await this.authService.signOutAllDevices(req.user.id);
    return { message: 'Signed out from all devices' };
  }

  // GOOGLE AUTH 2 ***********************************************************
  //
  // The whole Google sign-in is a round-trip across the two routes below:
  //
  //   1. Frontend sends the browser to GET /auth/google/login
  //        (full page navigation, e.g. window.location.href — NOT fetch/Axios).
  //   2. AuthGuard('google') runs BEFORE the handler. Since there is no
  //        ?code=... yet, Passport treats this as the "start": it builds the
  //        Google consent URL (client_id, callbackURL, scope) and replies with
  //        a 302 redirect. So the handler body never really runs — the guard
  //        does the redirect for us.
  //   3. Browser follows the 302 and shows Google's login/consent page.
  //   4. After the user approves, Google redirects the browser back to our
  //        callbackURL (/auth/google/callback) with a ?code=...
  //   5. On the callback, AuthGuard('google') sees the code, exchanges it for
  //        the user's Google profile, and calls GoogleStrategy.validate(),
  //        which finds or creates the user and puts them on req.user.
  //   6. Our callback handler then issues OUR own JWT and redirects the browser
  //        back to the frontend with the tokens in the URL.

  @Public()
  @Get('google/login')
  @UseGuards(AuthGuard('google')) // starts the flow → guard redirects to Google
  async googleAuth() {
    // Intentionally empty: AuthGuard('google') already sent the 302 to Google,
    // so nothing here needs to run.
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google')) // Google sends the user here with ?code=...
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    // Guard has validated the Google user and set req.user (find-or-create).
    // Now mint our own access + refresh tokens for that user...
    const response = await this.authService.login(req.user.id);
    // ...and hand them to the frontend via the success URL.
    res.redirect(`http://localhost:4200/login-success?token=${response.token}&refreshToken=${response.refreshToken}`);
  }

  // change password **********************************************************
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

  @Public()
  @ApiParam({ name: 'realmName', example: 'master', description: 'Realm the user belongs to' })
  @Post(':realmName/forgot-password')
  forgotPassword(
    @Param('realmName') realmName: string,
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(
      forgotPasswordDto.email,
      forgotPasswordDto.type,
      realmName,
    );
  }

  @Public()
  @ApiParam({ name: 'realmName', example: 'master', description: 'Realm the user belongs to' })
  @Post(':realmName/verify-identifier')
  verifyIdentifier(
    @Param('realmName') realmName: string,
    @Body() verifyIdentifierDto: VerifyIdentifierDto,
  ) {
    return this.authService.verifyIdentifier(
      verifyIdentifierDto.token,
      verifyIdentifierDto.user,
      realmName,
    );
  }
}
