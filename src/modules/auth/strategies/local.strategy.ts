/**
 * Local strategy ('local') — verifies username + password within a realm.
 * Runs once on POST /auth/login. Looks up the user (scoped to realmId) and
 * bcrypt-compares the password; on success attaches the user to req.user. Does
 * NOT issue a token — the controller calls AuthService.login() afterwards.
 *
 * `passReqToCallback` is enabled so we can read `realmId` from the body: the
 * same username can exist in different realms, so login must be realm-scoped.
 */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  validate(req: Request, username: string, password: string) {
    const realmId = req.body?.realmId as string;
    return this.authService.validateUser(username, password, realmId);
  }
}
