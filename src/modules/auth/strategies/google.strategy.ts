/**
 * Google OAuth 2.0 strategy ('google') — sign-in via Google.
 * Used by /auth/google/login and /auth/google/callback. After Google
 * authenticates the user, validate() provisions the user if new
 * (validateGoogleUser) and returns them with roles for token issuance.
 */
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, photos } = profile;

    const googleUser = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      avatarUrl: photos[0].value,
      password: '',
      accessToken,
    };

    const user = await this.authService.validateGoogleUser(googleUser);
    const userWithRoles = await this.authService.validateUserRole(user.id);
    done(null, userWithRoles);
  }
}
