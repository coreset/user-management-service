import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UsersService } from '../users/users.service';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserVerificationIdentifier } from './entities/user-verification-identifier.entity';
import { UserSession } from './entities/user-session.entity';
import { MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { parseExpiry } from 'src/common/utils/time.util';
import { CurrentUser } from './types/current-user';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RealmsService } from '../realms/realms.service';
import { PasswordHistory } from '../users/entities/password-history.entity';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../../common/audit/audit.service';
import { LocalRegisterDto } from './dto/local-register.dto';
import { SettingsService } from '../settings/settings.service';

/** How many previous passwords to block from reuse. */
const PASSWORD_HISTORY_COUNT = 5;

/**
 * A valid (cost-12) bcrypt hash that no real password produces. Used to run a
 * throwaway bcrypt compare on the user-not-found path so login responses take
 * the same time whether or not the username exists (resists enumeration).
 */
const DUMMY_PASSWORD_HASH =
  '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';

/** Optional context captured at login for the session record. */
export type LoginContext = {
  ip?: string;
  userAgent?: string;
  rememberMe?: boolean;
};


enum NotifyType {
  URL= 'url',
  CODE= 'code',
}


@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly realmsService: RealmsService,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
    @InjectRepository(User) private UserRepo: Repository<User>,
    @InjectRepository(RefreshToken) private RefreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(UserVerificationIdentifier) private UserVerificationIdentifierRepo: Repository<UserVerificationIdentifier>,
    @InjectRepository(UserSession) private userSessionRepo: Repository<UserSession>,
    @InjectRepository(PasswordHistory) private passwordHistoryRepo: Repository<PasswordHistory>,
  ) {}

  /**
   * Validates credentials for a username within a realm (realm comes from the
   * URL path, e.g. /auth/:realmName/login). Enforces account lockout, equalizes
   * timing to resist username enumeration, and blocks unverified emails.
   */
  async validateUser(username: string, password: string, realmName: string) {
    if (!realmName) {
      throw new BadRequestException('realm is required');
    }

    // Resolve the realm from its (globally-unique) name.
    const realm = await this.realmsService.findByName(realmName);
    if (!realm) {
      throw new NotFoundException(`Realm '${realmName}' not found`);
    }
    const realmId = realm.id;

    // username is unique only WITHIN a realm, so the lookup must be scoped.
    const user = await this.userService.findByUsername(username, realmId);

    // Anti-enumeration: run a bcrypt compare even when the user is missing so
    // the not-found path costs the same wall-clock time as a wrong password.
    if (!user) {
      await compare(password, DUMMY_PASSWORD_HASH);
      await this.auditService.recordAuthEvent({
        action: 'USER_LOGIN_FAILED',
        status: 'FAILURE',
        actorUsername: username,
        realmId,
      });
      throw new UnauthorizedException('Invalid username or password');
    }

    // Reject locked accounts before touching the password.
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      await this.auditService.recordAuthEvent({
        action: 'USER_LOGIN_FAILED',
        status: 'FAILURE',
        actorId: user.id,
        actorUsername: username,
        realmId,
      });
      throw new UnauthorizedException(
        'Account is temporarily locked due to too many failed login attempts. Please try again later.',
      );
    }

    const isPasswordMatch = await compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      await this.registerFailedAttempt(user, realmId);
      await this.auditService.recordAuthEvent({
        action: 'USER_LOGIN_FAILED',
        status: 'FAILURE',
        actorId: user.id,
        actorUsername: username,
        realmId,
      });
      throw new UnauthorizedException('Invalid username or password');
    }

    // block login until the email address has been verified
    if (!user.isEmailVerified) {
      await this.auditService.recordAuthEvent({
        action: 'USER_LOGIN_FAILED',
        status: 'FAILURE',
        actorId: user.id,
        actorUsername: username,
        realmId,
      });
      throw new UnauthorizedException(
        'Your account email is not verified. Please verify your email before logging in.',
      );
    }

    // Valid credentials: clear any prior lockout counters.
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.UserRepo.update(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }

    return user;
  }

  /**
   * Increments the failed-login counter and locks the account once the realm's
   * `max_login_attempts` threshold is reached, for `lockout_duration_seconds`.
   */
  private async registerFailedAttempt(user: User, realmId: string): Promise<void> {
    const maxAttempts = await this.getIntSetting(realmId, 'max_login_attempts', 5);
    const lockoutSeconds = await this.getIntSetting(
      realmId,
      'lockout_duration_seconds',
      900,
    );

    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const patch: Partial<User> = { failedLoginAttempts: attempts };
    if (attempts >= maxAttempts) {
      patch.lockedUntil = new Date(Date.now() + lockoutSeconds * 1000);
    }
    await this.UserRepo.update(user.id, patch);
  }

  /** Reads an integer realm setting, falling back to a default if unset/invalid. */
  private async getIntSetting(
    realmId: string,
    key: string,
    fallback: number,
  ): Promise<number> {
    try {
      const setting = await this.settingsService.get(realmId, key);
      const n = Number(setting.value);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    } catch {
      return fallback;
    }
  }

  /*
   * ---------------------------------------------------------------------------
   * OLD login() — HS256 for BOTH tokens (kept for reference).
   * Signed the access token with the single global JWT_SECRET (HS256), so other
   * services could only verify it by sharing that secret. Replaced by the RS256
   * version below, which signs the access token with the realm's own private key
   * so external services can verify via the public key / JWKS.
   * ---------------------------------------------------------------------------
   *
   * async login(userId: string) {
   *   const secret = this.configService.get<string>('REFRESH_JWT_SECRET', '');
   *   const expiresIn = this.configService.get<string>('REFRESH_JWT_EXPIRE_IN', '');
   *
   *   // load the user (with its realm) so the token carries the realm claim
   *   const user = await this.userService.findById(userId);
   *   if (!user) throw new NotFoundException('User not found');
   *
   *   const payload: AuthJwtPayload = { sub: userId, realm: user.realm?.realmName };
   *
   *   // generate access token and refresh token
   *   const token = this.jwtService.sign(payload);
   *   const refreshToken = this.jwtService.sign(payload, {
   *     secret,
   *     expiresIn,
   *   });
   *
   *   const hashedRefreshToken = await argon2.hash(refreshToken);
   *   const refreshTokenObject = this.RefreshTokenRepo.create({
   *     token: hashedRefreshToken,
   *     user: user,
   *     expiresAt: new Date(Date.now() + parseExpiry(expiresIn)),
   *   });
   *   await this.RefreshTokenRepo.save(refreshTokenObject);
   *
   *   // return values to clients.
   *   return {
   *     id: userId,
   *     token,
   *     refreshToken,
   *   };
   * }
   */

  /**
   * NEW login() — Option B (hybrid signing):
   *   - ACCESS token  → RS256, signed with the user's realm private key (+ kid).
   *     Verifiable by other services via the realm public key / JWKS.
   *   - REFRESH token → HS256, signed with REFRESH_JWT_SECRET. It never leaves
   *     this service and is also stored argon2-hashed in the DB, so asymmetric
   *     signing would add nothing here.
   */
  
  /**
   * @see 
   */
  async login(userId: string, context?: LoginContext, preloaded?: User) {
    // Reuse the caller's already-loaded user when provided (the local-login path
    // hands us the user from validateUser, avoiding a second DB round-trip);
    // otherwise load it (with its realm) so the token can carry the realm claim.
    const user = preloaded ?? (await this.userService.findById(userId));
    if (!user) throw new NotFoundException('User not found');

    const realmName = user.realm?.realmName;
    if (!realmName) throw new NotFoundException('User is not attached to a realm');

    const payload: AuthJwtPayload = { sub: userId, realm: realmName };

    // ----- Access token: RS256 with the realm's active private key -----------
    const signingKey = await this.realmsService.getActiveSigningKey(realmName);
    const accessExpiresIn = this.configService.get<string>('JWT_EXPIRE_IN', '1d');
    const token = this.jwtService.sign(payload, {
      secret: signingKey.privateKey,
      algorithm: 'RS256',
      keyid: signingKey.kid, // stamps `kid` into the JWT header for verification
      expiresIn: accessExpiresIn,
    });

    // ----- Refresh token: stays HS256 (internal-only, also DB-hashed) --------
    const refreshSecret = this.configService.get<string>('REFRESH_JWT_SECRET', '');
    const refreshExpiresIn = this.configService.get<string>('REFRESH_JWT_EXPIRE_IN', '');
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    const hashedRefreshToken = await argon2.hash(refreshToken);
    const refreshTokenObject = this.RefreshTokenRepo.create({
      token: hashedRefreshToken,
      user: user,
      expiresAt: new Date(Date.now() + parseExpiry(refreshExpiresIn)),
    });
    await this.RefreshTokenRepo.save(refreshTokenObject);

    // ----- Record the SSO (user) session -------------------------------------
    await this.userSessionRepo.save(
      this.userSessionRepo.create({
        user,
        realm: user.realm,
        ipAddress: context?.ip ?? null,
        userAgent: context?.userAgent ?? null,
        rememberMe: context?.rememberMe ?? false,
        isActive: true,
        lastSeenAt: new Date(),
        expiresAt: new Date(Date.now() + parseExpiry(refreshExpiresIn)),
      }),
    );

    // ----- Audit: successful login -------------------------------------------
    await this.auditService.recordAuthEvent({
      action: 'USER_LOGIN',
      status: 'SUCCESS',
      actorId: userId,
      actorUsername: user.username,
      realmId: user.realm?.id,
      ipAddress: context?.ip ?? null,
      userAgent: context?.userAgent ?? null,
    });

    // ----- Track last successful login --------------------------------------
    await this.UserRepo.update(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: context?.ip ?? null,
    });

    // return values to clients.
    return {
      id: userId,
      token,
      refreshToken,
    };
  }

  //refreshToken(userId: number) {
  //  // TODO add 'Refresh Token Ratation' method if you want
  //  const payload: AuthJwtPayload = { sub: userId };
  //  const token = this.jwtService.sign(payload);
  //  return {
  //    id: userId,
  //    token,
  //  };
  //}

  async refreshToken(userId: string, oldRefreshToken: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Find all refresh tokens for the user (or latest one if you're storing just one)
    const tokens = await this.RefreshTokenRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    if (!tokens.length) throw new ForbiddenException('No refresh token found');

    // Find matching token
    const validTokenEntry = await Promise.any(
      tokens.map(async (tokenEntry) => {
        const isValid = await argon2.verify(tokenEntry.token, oldRefreshToken);
        return isValid ? tokenEntry : Promise.reject('');
      }),
    ).catch(() => null);

    if (!validTokenEntry)
      throw new ForbiddenException('Refresh token does not match');

    // Token matched, delete the old one (rotation step)
    await this.RefreshTokenRepo.delete({ token: validTokenEntry.token });

    // Generate new access and refresh tokens
    const secret = this.configService.get<string>('REFRESH_JWT_SECRET', '');
    const expiresIn = this.configService.get<string>('REFRESH_JWT_EXPIRE_IN', '');
    const realmName = user.realm?.realmName;
    if (!realmName) throw new NotFoundException('User is not attached to a realm');
    const payload: AuthJwtPayload = { sub: userId, realm: realmName };

    // Access token must be RS256 (realm key) to match the jwt-rs256 guard.
    const signingKey = await this.realmsService.getActiveSigningKey(realmName);
    const newAccessToken = this.jwtService.sign(payload, {
      secret: signingKey.privateKey,
      algorithm: 'RS256',
      keyid: signingKey.kid,
      expiresIn: this.configService.get<string>('JWT_EXPIRE_IN', '1d'),
    });
    const newRefreshToken = this.jwtService.sign(payload, { secret, expiresIn });

    // Hash and save new refresh token
    const hashedNewRefreshToken = await argon2.hash(newRefreshToken);
    const newTokenObject = this.RefreshTokenRepo.create({
      token: hashedNewRefreshToken,
      user: user,
      expiresAt: new Date(Date.now() + parseExpiry(expiresIn)),
    });

    await this.RefreshTokenRepo.save(newTokenObject);

    return {
      id: userId,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('Invalid Refresh Token');

    const unExpiredTokens = await this.RefreshTokenRepo.find({
      where: {
        user: { id: userId },
        expiresAt: MoreThanOrEqual(new Date()),
      },
    });

    for (const tokenRecord of unExpiredTokens) {
      const isValid = await argon2.verify(tokenRecord.token, refreshToken);
      if (isValid) {
        return true;
      }
    }
    return false;
  }

  // create(createAuthDto: CreateAuthDto) {
  //   return 'This action adds a new auth';
  // }
  /**
   * @see 
   */
  async register(registerDto: LocalRegisterDto) {
    const { realmId, email, firstName, lastName, avatarUrl, password } = registerDto;
    let userName:string = ''; 
    if (!registerDto.username) {
      userName = registerDto.email;
    } else {
      userName = registerDto.username;
    }

    // check realm 
    const realm = await this.realmsService.findOne(registerDto.realmId);
    if (!realm) {
      throw new NotFoundException('Organization ID not found');
    }

    // check user uniqueness WITHIN the realm (email/username are realm-scoped)
    const userByEmail = await this.userService.findByEmail(registerDto.email, realmId);
    if (userByEmail) {
      throw new ConflictException('Email is already registered');
    }

    const userByUsername = await this.userService.findByUsername(userName, realmId);
    if (userByUsername) {
      throw new ConflictException('Username is already registered');
    }

    // check realm settings for user registration
    const settings = await this.settingsService.list(realmId);
    settings.forEach(setting => {
      switch (setting.key) {
        case 'allow_user_registration':
          const { value } = setting;
          if (value == 'false' ) throw new UnprocessableEntityException('This organization not allow user registration')
          break;
        default:
          null

      }
    })

    const user = this.UserRepo.create({
      username: userName,
      email,
      firstName,
      lastName,
      avatarUrl,
      passwordHash: password,
      realm,
    });

    try {
      const savedUser = await this.UserRepo.save(user);
      return savedUser;
    } catch (error) {
      throw new InternalServerErrorException('Failed to register user');
    }


  }

  findAll(userId: string) {
    return {
      id: userId,
    };
  }

  findOne(id: string) {
    return this.userService.findOne(id);
  }

  update(id: string, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: string) {
    return `This action removes a #${id} auth`;
  }

  async signOutCurrentDevice(userId: string, refreshToken: string): Promise<void> {
    const tokens = await this.RefreshTokenRepo.find({
      where: { user: { id: userId } },
    });

    // Match and remove the current token
    for (const tokenEntry of tokens) {
      const isMatch = await argon2.verify(tokenEntry.token, refreshToken);
      if (isMatch) {
        await this.RefreshTokenRepo.delete({ token: tokenEntry.token });
        await this.auditService.recordAuthEvent({
          action: 'USER_LOGOUT',
          status: 'SUCCESS',
          actorId: userId,
        });
        return;
      }
    }
    throw new ForbiddenException('Refresh token not found or already invalidated');
  }

  async signOutAllDevices(userId: string): Promise<void> {
    await this.RefreshTokenRepo.delete({ user: { id: userId } });
    // Revoke active SSO sessions too (full sign-out across devices).
    await this.userSessionRepo.update(
      { user: { id: userId }, isActive: true },
      { isActive: false },
    );
    await this.auditService.recordAuthEvent({
      action: 'USER_LOGOUT_ALL',
      status: 'SUCCESS',
      actorId: userId,
    });
  }

  async validateUserRole(userId: string): Promise<CurrentUser> {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found!');
    const currentUser: CurrentUser = {
      id: user.id,
      realmId: user.realm?.id,
      roles: user.roles,
    };
    return currentUser;
  }

  async validateGoogleUser(googleUser: CreateUserDto) {
    const user = await this.userService.findByEmail(googleUser.email);
    if (user) return user;
    return await this.userService.create(googleUser);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    // find the user
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found!');
    // compare the old password with the password in DB
    const isPasswordMatch = await compare(oldPassword, user.passwordHash);
    // change user's password with HASH
    if (!isPasswordMatch) {
      throw new BadRequestException('Old password is incorrect.');
    }

    // enforce "no reuse of recent passwords"
    if (await this.isPasswordReused(userId, newPassword, user.passwordHash)) {
      throw new BadRequestException('You cannot reuse a recent password.');
    }

    // archive the CURRENT hash into history before overwriting it
    await this.passwordHistoryRepo.save(
      this.passwordHistoryRepo.create({
        user: { id: userId } as User,
        passwordHash: user.passwordHash,
      }),
    );

    // hash new password
    const hashedPassword = await hash(newPassword, 10);
    await this.userService.updatePasswordById(userId, hashedPassword);

    await this.auditService.recordAuthEvent({
      action: 'PASSWORD_CHANGE',
      status: 'SUCCESS',
      actorId: userId,
      actorUsername: user.username,
      realmId: user.realm?.id,
    });

    return { message: 'Password updated successfully' };
  }

  /** True if newPassword matches the current hash or any of the last N history hashes. */
  private async isPasswordReused(
    userId: string,
    newPassword: string,
    currentHash: string,
  ): Promise<boolean> {
    if (await compare(newPassword, currentHash)) return true;

    const recent = await this.passwordHistoryRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: PASSWORD_HISTORY_COUNT,
    });
    for (const entry of recent) {
      if (await compare(newPassword, entry.passwordHash)) return true;
    }
    return false;
  }

  async forgotPassword(email: string, type: NotifyType) {
    // 1. Find user
    const user = await this.userService.findByEmail(email);
    if (!user) {
      // Don't reveal if user doesn't exist for security best practice.
      //this.logger.log(`Password reset requested for non-existent email: ${email}`);
      return; // Silent return
    }

    // 2. Invalidate any existing tokens
    await this.UserVerificationIdentifierRepo.delete({
      user: { id: user.id },
      used: false,
      type,
    });

    // 3. Generate expiration
    const expiresIn = this.configService.get<string>('PASSWORD_RESET_TOKEN_EXPIRE_IN', '');
    const expiresAt = new Date(Date.now() + parseExpiry(expiresIn));

    if (type === NotifyType.URL) {
      // Generate token 
      const resetToken = randomBytes(32).toString('hex');
      const hashedToken = await hash(resetToken, 10);

      // Store token
      await this.UserVerificationIdentifierRepo.save({
        token: hashedToken,
        user,
        expiresAt,
        type: NotifyType.URL,
      });

      const frontendUrl = this.configService.get<string>('FRONTEND_BASE_URL', '');
      const resetUrl = new URL(`${frontendUrl}/verify-identifier`);
      resetUrl.searchParams.set('token', resetToken);
      resetUrl.searchParams.set('id', user.id.toString());
      console.log('reset url:', resetUrl.toString());

    } else if (type === NotifyType.CODE) {
      // Generate pin code
      const rawCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
      const hashedCode = await hash(rawCode, 10);

      // Store pin code
      await this.UserVerificationIdentifierRepo.save({
        token: hashedCode,
        user,
        expiresAt,
        type: NotifyType.CODE,
      });

      console.log(`Generated code for user ${user.email}: ${rawCode}`);
      // Send via SMS or email here
    }
    // 7. Message to client
    return { message: 'if this user exits, they will receive an email' };
  }

  async verifyIdentifier(secret: string, user: string) {
    let userId: string;
    let type: NotifyType;

    if (user.includes('@')) {
      // Type: email (code flow)
      const userEntity = await this.userService.findByEmail(user);
      if (!userEntity) {
        throw new UnauthorizedException('Invalid user');
      }
      userId = userEntity.id;
      type = NotifyType.CODE;
    } else {
      // Type: user id (reset-link/URL flow)
      if (!user) {
        throw new UnauthorizedException('Invalid user identifier');
      }
      userId = user;
      type = NotifyType.URL;
    }

    // 1. Find all active tokens for user
    const tokens = await this.UserVerificationIdentifierRepo.find({
      where: {
        user: { id: userId },
        used: false,
        expiresAt: MoreThan(new Date()),
        type,
      },
    });

    // 2. Compare against each (bcrypt.compare is slow-by-design)
    for (const tokenRecord of tokens) {
      if (await compare(secret, tokenRecord.token)) {
        return this.login(userId);
      }
    }

    throw new UnauthorizedException('Token not valid or expired!');
  }
}
