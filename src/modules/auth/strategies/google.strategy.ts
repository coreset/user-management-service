/**
 * Google OAuth 2.0 strategy ('google') — sign-in via Google.
 * Used by /auth/google/login and /auth/google/callback. After Google
 * authenticates the user, validate() provisions the user if new
 * (validateGoogleUser) and returns them with roles for token issuance.
 *
 * Realm flow:
 *   1. Frontend visits /auth/google/login?realmName=<name>
 *   2. authenticate() encodes realmName into the OAuth `state` parameter.
 *   3. Google returns state untouched on the callback.
 *   4. validate() parses state → realmName and passes it to validateGoogleUser.
 */
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
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
      passReqToCallback: true,
    });
  }

  /** Encode realmName into the OAuth state so it survives the Google redirect. */
  authenticate(req: Request, options?: any) {
    const realmName = (req.query?.realmName as string) ?? '';
    const state = Buffer.from(JSON.stringify({ realmName })).toString('base64url');
    super.authenticate(req, { ...options, state });
  }

  async validate(
    req: Request,
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    // Parse realmName back from the state Google returned.
    let realmName = '';
    try {
      const raw = (req.query?.state as string) ?? '';
      realmName = JSON.parse(Buffer.from(raw, 'base64url').toString()).realmName ?? '';
    } catch {
      // state missing or malformed — realmName stays empty; service will reject
    }

    const user = await this.authService.validateGoogleUser(
      {
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        avatarUrl: photos[0].value,
        password: '',
      },
      realmName,
    );

    const userWithRoles = await this.authService.validateUserRole(user.id);
    done(null, userWithRoles);
  }
}
