import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UsersService } from '../users/users.service';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { parseExpiry } from 'src/common/utils/time.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken) private RefreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User Not found!');
    }
    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
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

  findAll() {
    return `This action returns all auth`;
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
}
