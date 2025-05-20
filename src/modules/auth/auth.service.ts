import { 
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
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
import { MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { parseExpiry } from 'src/common/utils/time.util';
import { CurrentUser } from './types/current-user';
import { CreateUserDto } from '../users/dto/create-user.dto';


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
    @InjectRepository(RefreshToken) private RefreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(UserVerificationIdentifier) private UserVerificationIdentifierRepo: Repository<UserVerificationIdentifier>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  async login(userId: number) {
    const secret = this.configService.get<string>('REFRESH_JWT_SECRET', '');
    const expiresIn = this.configService.get<string>('REFRESH_JWT_EXPIRE_IN', '');
    const payload: AuthJwtPayload = { sub: userId };

    // generate access token and refresh token
    const token = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });

    // hash the refresh token and save it on the 'refresh_tokens' table
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const hashedRefreshToken = await argon2.hash(refreshToken);
    const refreshTokenObject = this.RefreshTokenRepo.create({
      token: hashedRefreshToken,
      user: user,
      expiresAt: new Date(Date.now() + parseExpiry(expiresIn)),
    });
    await this.RefreshTokenRepo.save(refreshTokenObject);

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

  async refreshToken(userId: number, oldRefreshToken: string) {
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
    const payload: AuthJwtPayload = { sub: userId };

    const newAccessToken = this.jwtService.sign(payload);
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

  async validateRefreshToken(userId: number, refreshToken: string) {
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

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll(userId: number) {
    return {
      id: userId,
    };
  }

  findOne(id: number) {
    return this.userService.findOne(id);
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  async signOutCurrentDevice(userId: number, refreshToken: string): Promise<void> {
    const tokens = await this.RefreshTokenRepo.find({
      where: { user: { id: userId } },
    });

    // Match and remove the current token
    for (const tokenEntry of tokens) {
      const isMatch = await argon2.verify(tokenEntry.token, refreshToken);
      if (isMatch) {
        await this.RefreshTokenRepo.delete({ token: tokenEntry.token });
        return;
      }
    }
    throw new ForbiddenException('Refresh token not found or already invalidated');
  }

  async signOutAllDevices(userId: number): Promise<void> {
    await this.RefreshTokenRepo.delete({ user: { id: userId } });
  }

  async validateUserRole(userId: number): Promise<CurrentUser> {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found!');
    const currentUser: CurrentUser = {
      id: user.id,
      roles: user.roles,
    };
    return currentUser;
  }

  async validateGoogleUser(googleUser: CreateUserDto) {
    const user = await this.userService.findByEmail(googleUser.email);
    if (user) return user;
    return await this.userService.create(googleUser);
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    // find the user
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found!');
    // compare the old password with the password in DB
    const isPasswordMatch = await compare(oldPassword, user.password);
    // change user's password with HASH
    if (!isPasswordMatch) {
      throw new BadRequestException('Old password is incorrect.');
    }
    // hash new password
    const hashedPassword = await hash(newPassword, 10);
    await this.userService.updatePasswordById(userId, hashedPassword);

    return { message: 'Password updated successfully' };
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

  async verifyIdentifier(secret: string, user: number | string) {
    let userId: number;
    let type: NotifyType;
    console.log('verifyIdentifier ::', secret, user);

    if (typeof user === 'string' && isNaN(Number(user))) {
      // Type: email
      const userEntity = await this.userService.findByEmail(user);
      if (!userEntity) {
        throw new UnauthorizedException('Invalid user');
      }
      userId = userEntity.id;
      type = NotifyType.CODE;
      console.log('code', type, userId);
    } else {
      // Type: code
      userId = Number(user);
      if (isNaN(userId)) {
        throw new UnauthorizedException('Invalid user identifier');
      }
      type = NotifyType.URL;
      console.log('url', type, userId);
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
