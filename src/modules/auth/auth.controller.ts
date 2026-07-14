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
import { ApiBody, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../permission/decorators/permissions.decorator';
import { PermissionKey } from '../permission/constants/permission-key.enum';
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

@ApiTags('Auth')
@Controller('auth')
@ApiBearerAuth('authorization') // for add authrization header with swagger
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * @see
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in',
    description: 'Validates credentials within the given realm and issues an access + refresh token pair.',
  })
  @ApiParam({ name: 'realmName', example: 'master', description: 'Realm the user belongs to' })
  @ApiBody({ type: LocalLoginDto })
  @ApiResponse({ status: 200, description: 'Login successful.', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid username/password, or account locked out.' })
  @ApiResponse({ status: 404, description: "Realm 'realmName' not found." })
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
  @ApiOperation({
    summary: 'Register a new account',
    description: 'Self-service registration within the given realm. The account must verify its email before it can log in.',
  })
  @ApiParam({ name: 'realmName', example: 'master', description: 'Realm the user registers into' })
  @ApiBody({type: LocalRegisterDto})
  @ApiResponse({ status: 200, description: 'Registration successful; verification email sent.', type: RegisterResponseDto })
  @ApiResponse({ status: 404, description: "Realm 'realmName' not found." })
  @ApiResponse({ status: 409, description: 'Email or username is already registered.' })
  @ApiResponse({ status: 422, description: 'This organization does not allow self-service registration.' })
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

  @Permissions([PermissionKey.USERS_READ])
  @Get()
  @ApiOperation({ summary: 'Get the current session identity' })
  @ApiResponse({ status: 200, description: 'The authenticated user\'s id.' })
  findAll(@Req() req: Request) {
    return this.authService.findAll(req.user.id);
  }

  @Public()
  @UseGuards(AuthGuard('refresh-jwt'))
  @Post('refresh') // validates the refresh token against the hashed DB copy.
  @ApiOperation({
    summary: 'Refresh an access token',
    description: 'Exchanges a valid refresh token (in the Authorization header) for a new access + refresh token pair.',
  })
  @ApiResponse({ status: 201, description: 'New token pair issued.' })
  @ApiResponse({ status: 403, description: 'No matching refresh token found for this user.' })
  @ApiResponse({ status: 404, description: 'User not found, or not attached to a realm.' })
  refreshToken(@Req() req: Request) {
    const token: string = req.get('authorization')!.replace('Bearer', '').trim();
    return this.authService.refreshToken(req.user.id, token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get limited user fields by id' })
  @ApiParam({ name: 'id', required: true, format: 'uuid', description: 'UUID of the user' })
  @ApiResponse({ status: 200, description: 'The requested user\'s public fields, or null if not found.' })
  findOne(@Param('id') id: string) {
    return this.authService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an auth record (not yet implemented)' })
  @ApiParam({ name: 'id', required: true, format: 'uuid', description: 'UUID of the record' })
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(id, updateAuthDto);
  }

  @Permissions([PermissionKey.USERS_DELETE])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an auth record (not yet implemented)' })
  @ApiParam({ name: 'id', required: true, format: 'uuid', description: 'UUID of the record' })
  remove(@Param('id') id: string) {
    return this.authService.remove(id);
  }

  @Public()
  @UseGuards(AuthGuard('refresh-jwt'))
  @Post('signout')
  @ApiOperation({
    summary: 'Sign out the current device',
    description: 'Invalidates the refresh token (in the Authorization header) for the current device only.',
  })
  @ApiResponse({ status: 201, description: 'Signed out from current device.' })
  @ApiResponse({ status: 403, description: 'Refresh token not found or already invalidated.' })
  async signOut(@Req() req: Request) {
    const refreshToken: string = req.get('authorization')!.replace('Bearer', '').trim();
    await this.authService.signOutCurrentDevice(req.user.id, refreshToken);
    return { message: 'Signed out from current device' };
  }

  @Public()
  @UseGuards(AuthGuard('refresh-jwt'))
  @Post('signout/all')
  @ApiOperation({
    summary: 'Sign out all devices',
    description: 'Invalidates every refresh token issued to the current user.',
  })
  @ApiResponse({ status: 201, description: 'Signed out from all devices.' })
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
  @ApiOperation({
    summary: 'Start Google OAuth login',
    description: 'Full-page-navigation only (not fetch/XHR). Redirects the browser to Google\'s consent screen.',
  })
  @ApiResponse({ status: 302, description: 'Redirect to Google\'s OAuth consent screen.' })
  async googleAuth() {
    // Intentionally empty: AuthGuard('google') already sent the 302 to Google,
    // so nothing here needs to run.
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google')) // Google sends the user here with ?code=...
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Google redirects here with ?code=. Issues our own token pair and redirects to the frontend.',
  })
  @ApiResponse({ status: 302, description: 'Redirect to the frontend with token + refreshToken in the URL.' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    // Guard has validated the Google user and set req.user (find-or-create).
    // Now mint our own access + refresh tokens for that user...
    const response = await this.authService.login(req.user.id);
    // ...and hand them to the frontend via the success URL.
    res.redirect(`http://localhost:4200/login-success?token=${response.token}&refreshToken=${response.refreshToken}`);
  }

  // change password **********************************************************
  @Put('change-password')
  @ApiOperation({ summary: 'Change the current user\'s password' })
  @ApiResponse({ status: 200, description: 'Password changed.' })
  @ApiResponse({ status: 400, description: 'Old password is incorrect, or new password reuses a recent password.' })
  @ApiResponse({ status: 401, description: 'User not found.' })
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
  @ApiOperation({
    summary: 'Request a password reset',
    description: 'Always returns the same generic message, whether or not the realm/email exists, to prevent account enumeration.',
  })
  @ApiResponse({ status: 201, description: 'Generic acknowledgement (does not reveal whether the account exists).' })
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
  @ApiOperation({
    summary: 'Verify a password-reset token/code, or an email-verification identifier',
  })
  @ApiResponse({ status: 201, description: 'Identifier verified; returns a short-lived token.' })
  @ApiResponse({ status: 401, description: 'Invalid user, invalid identifier, or token not valid/expired.' })
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
